import type { PrismaClient } from "@lite-llm/model-proxy-repository";
import { getModelProxyPrisma } from "@lite-llm/model-proxy-repository";
import type { IModelService, IProviderService } from "@lite-llm/models-service";
import { calculateCost } from "./logging/cost-calculator";
import { redactHeaders } from "./logging/payload-redactor";
import {
  createCancelledError,
  createParseError,
  createRequestAbortSignal,
  createTimeoutError,
  createUpstreamHttpError,
  createUpstreamNetworkError,
  DEFAULT_REQUEST_TIMEOUT_MS,
  isAbortError,
  isLedgerHandledError,
  isTimeoutError,
  LedgerHandledError,
  mergeAbortSignals,
  trimErrorMessage,
  unwrapLedgerHandledError,
} from "./logging/request-errors";
import { RequestLedger } from "./logging/request-ledger";
import {
  extractUsage,
  readUsageFromStreamBuffer,
  type UsageSummary,
} from "./logging/usage-extractor";
import {
  type ResolvedUpstreamTarget,
  resolveUpstreamTarget,
} from "./resolver/upstream-provider";
import {
  type ChatCompletionsRequest,
  chatCompletionsRequestSchema,
  type ModelListEntry,
  type ModelListResponse,
} from "./schemas";
import type {
  IModelProxyService,
  ModelProxyServiceOptions,
  ProxyResponse,
  StreamingProxyResponse,
} from "./types";

function buildChatCompletionsUrl(baseUrl: string): string {
  if (baseUrl.endsWith("/chat/completions")) {
    return baseUrl;
  }
  return `${baseUrl}/chat/completions`;
}

function toObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export class ModelProxyService implements IModelProxyService {
  private readonly database?: PrismaClient;
  private readonly fetchFn: typeof fetch;
  private readonly ledger: RequestLedger;
  private readonly modelsService: IModelService;
  private readonly now: () => Date;
  private readonly providerService: IProviderService;

  constructor(options: ModelProxyServiceOptions) {
    this.database = options.database;
    this.fetchFn = options.fetchFn ?? fetch;
    this.modelsService = options.modelsService;
    this.providerService = options.providerService;
    this.now = options.now ?? (() => new Date());
    this.ledger = new RequestLedger(this.getDatabase());
  }

  private getDatabase(): PrismaClient {
    return this.database ?? getModelProxyPrisma();
  }

  onRequestFinished(listener: (requestId: string) => void): () => void {
    return this.ledger.onRequestFinished(listener);
  }

  async listModels(): Promise<ModelListResponse> {
    const database = this.getDatabase();
    const proxyModels = await database.modelProxyModel.findMany({
      where: { enabled: true },
      orderBy: { modelName: "asc" },
    });

    const modelEntries =
      proxyModels.length > 0
        ? proxyModels.map((row) => this.toModelListEntry(row))
        : await this.listFallbackModels();

    return {
      object: "list",
      data: modelEntries,
    };
  }

  async createChatCompletion(
    rawRequest: ChatCompletionsRequest,
    signal?: AbortSignal,
  ): Promise<ProxyResponse> {
    const request = chatCompletionsRequestSchema.parse(rawRequest);
    const target = await this.resolveTarget(request.model);
    const startedAt = this.now();
    const requestRow = await this.ledger.start(request, target, startedAt);
    const requestSignal = createRequestAbortSignal(signal);

    try {
      const response = await this.fetchFn(
        buildChatCompletionsUrl(target.upstreamBaseUrl),
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...target.upstreamHeaders,
          },
          body: JSON.stringify({ ...request, model: target.upstreamModel }),
          signal: requestSignal,
        },
      );

      const responseText = await response.text();
      const finishedAt = this.now();
      const latencyMs = finishedAt.getTime() - startedAt.getTime();

      if (!response.ok) {
        const error = createUpstreamHttpError(response.status, responseText, {
          body: responseText,
        });
        await this.ledger.fail(requestRow.id, target, {
          status: "failed",
          finishedAt,
          latencyMs,
          error,
          responseHeaders: redactHeaders(response.headers),
        });
        throw new LedgerHandledError(
          new Error(
            `Model proxy upstream failed (${response.status}): ${trimErrorMessage(responseText)}`,
          ),
        );
      }

      let payload: unknown;
      try {
        payload = JSON.parse(responseText) as unknown;
      } catch {
        const error = createParseError(
          "Failed to parse upstream JSON response",
        );
        await this.ledger.fail(requestRow.id, target, {
          status: "failed",
          finishedAt,
          latencyMs,
          error,
        });
        throw new LedgerHandledError(
          new SyntaxError("Failed to parse upstream JSON response"),
        );
      }

      const usage = extractUsage(payload);
      await this.ledger.complete(requestRow.id, target, {
        status: "success",
        finishedAt,
        latencyMs,
        usage,
        responseBody: payload,
        responseHeaders: redactHeaders(response.headers),
        upstreamRequestId: this.extractUpstreamRequestId(payload, response),
      });

      return {
        status: response.status,
        headers: new Headers(response.headers),
        payload,
      };
    } catch (error) {
      if (!isLedgerHandledError(error)) {
        await this.handleRequestError(
          requestRow.id,
          target,
          startedAt,
          error,
          undefined,
        );
      }
      throw unwrapLedgerHandledError(error);
    }
  }

  async createStreamingChatCompletion(
    rawRequest: ChatCompletionsRequest,
    signal?: AbortSignal,
  ): Promise<StreamingProxyResponse> {
    const request = chatCompletionsRequestSchema.parse({
      ...rawRequest,
      stream: true,
    });
    const target = await this.resolveTarget(request.model);
    const startedAt = this.now();
    const requestRow = await this.ledger.start(request, target, startedAt);
    const upstreamAbort = new AbortController();
    const requestSignal = mergeAbortSignals(
      signal,
      upstreamAbort.signal,
      AbortSignal.timeout(DEFAULT_REQUEST_TIMEOUT_MS),
    );

    let response: Response;
    try {
      response = await this.fetchFn(
        buildChatCompletionsUrl(target.upstreamBaseUrl),
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...target.upstreamHeaders,
          },
          body: JSON.stringify({ ...request, model: target.upstreamModel }),
          signal: requestSignal,
        },
      );
    } catch (error) {
      await this.handleRequestError(
        requestRow.id,
        target,
        startedAt,
        error,
        undefined,
      );
      throw error;
    }

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      const error = createUpstreamHttpError(
        response.status,
        errorText || `HTTP ${response.status}`,
        { body: errorText },
      );
      await this.ledger.fail(requestRow.id, target, {
        status: "failed",
        finishedAt: this.now(),
        latencyMs: this.now().getTime() - startedAt.getTime(),
        error,
        responseHeaders: redactHeaders(response.headers),
      });
      throw new Error(
        `Model proxy upstream failed (${response.status}): ${trimErrorMessage(errorText)}`,
      );
    }

    let usage: UsageSummary = {};
    let ttftMs: number | undefined;
    let upstreamRequestId: string | undefined;
    let streamFinished = false;
    let streamCancelled = false;

    const finishStreamOnce = async (
      finish: () => Promise<void>,
    ): Promise<void> => {
      if (streamFinished) {
        return;
      }
      streamFinished = true;
      await finish();
    };

    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (reader) {
            const result = await reader.read();
            if (result.done) {
              break;
            }

            if (streamCancelled) {
              break;
            }

            if (ttftMs === undefined) {
              ttftMs = this.now().getTime() - startedAt.getTime();
            }

            controller.enqueue(result.value);
            buffer += decoder.decode(result.value, { stream: true });
            upstreamRequestId ??=
              this.extractUpstreamRequestIdFromStream(buffer) ??
              this.extractUpstreamRequestId(null, response);
            usage = readUsageFromStreamBuffer(buffer, usage);
          }

          if (streamCancelled) {
            return;
          }

          buffer += decoder.decode();
          usage = readUsageFromStreamBuffer(buffer, usage);
          const finishedAt = this.now();
          const latencyMs = finishedAt.getTime() - startedAt.getTime();
          await finishStreamOnce(() =>
            this.ledger.complete(requestRow.id, target, {
              status: "success",
              finishedAt,
              latencyMs,
              ttftMs,
              usage,
              responseHeaders: redactHeaders(response.headers),
              upstreamRequestId,
            }),
          );
          if (!streamCancelled) {
            controller.close();
          }
        } catch (error) {
          if (streamCancelled) {
            return;
          }
          await finishStreamOnce(() =>
            this.handleRequestError(requestRow.id, target, startedAt, error, {
              ttftMs,
              usage,
              responseHeaders: redactHeaders(response.headers),
              upstreamRequestId,
            }),
          );
          if (!streamCancelled) {
            controller.error(error);
          }
        } finally {
          reader?.releaseLock();
        }
      },
      cancel: async () => {
        streamCancelled = true;
        upstreamAbort.abort(
          new DOMException("Client disconnected", "AbortError"),
        );
        await finishStreamOnce(() =>
          this.ledger.cancel(requestRow.id, target, {
            status: "cancelled",
            finishedAt: this.now(),
            latencyMs: this.now().getTime() - startedAt.getTime(),
            ttftMs,
            usage,
            error: createCancelledError("Client disconnected"),
            responseHeaders: redactHeaders(response.headers),
            upstreamRequestId,
          }),
        );
      },
    });

    return {
      status: response.status,
      headers: new Headers(response.headers),
      body: stream,
    };
  }

  private async handleRequestError(
    requestId: string,
    target: ResolvedUpstreamTarget,
    startedAt: Date,
    error: unknown,
    partial:
      | {
          responseHeaders?: Record<string, string>;
          ttftMs?: number;
          upstreamRequestId?: string;
          usage?: UsageSummary;
        }
      | undefined,
  ): Promise<void> {
    const finishedAt = this.now();
    const latencyMs = finishedAt.getTime() - startedAt.getTime();
    const usage = partial?.usage;

    if (isTimeoutError(error)) {
      await this.ledger.timeout(requestId, target, {
        status: "timeout",
        finishedAt,
        latencyMs,
        ttftMs: partial?.ttftMs,
        usage,
        error: createTimeoutError(),
        responseHeaders: partial?.responseHeaders,
        upstreamRequestId: partial?.upstreamRequestId,
      });
      return;
    }

    if (isAbortError(error)) {
      await this.ledger.cancel(requestId, target, {
        status: "cancelled",
        finishedAt,
        latencyMs,
        ttftMs: partial?.ttftMs,
        usage,
        error: createCancelledError(),
        responseHeaders: partial?.responseHeaders,
        upstreamRequestId: partial?.upstreamRequestId,
      });
      return;
    }

    const message = trimErrorMessage(String(error));
    await this.ledger.fail(requestId, target, {
      status: "failed",
      finishedAt,
      latencyMs,
      ttftMs: partial?.ttftMs,
      usage,
      error: createUpstreamNetworkError(message),
      responseHeaders: partial?.responseHeaders,
      upstreamRequestId: partial?.upstreamRequestId,
    });
  }

  private async listFallbackModels(): Promise<ModelListEntry[]> {
    const models = await this.modelsService.getAll();
    const created = Math.floor(this.now().getTime() / 1000);

    return Object.entries(models)
      .filter(([, spec]) => spec.enabled !== false)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, spec]) => ({
        id: name,
        object: "model" as const,
        created,
        owned_by: spec.ownedBy ?? spec.family ?? "local-proxy",
      }));
  }

  private toModelListEntry(row: {
    displayName?: string | null;
    family?: string | null;
    modelName: string;
    ownedBy?: string | null;
    updatedAt: Date;
  }): ModelListEntry {
    return {
      id: row.modelName,
      object: "model",
      created: Math.floor(row.updatedAt.getTime() / 1000),
      owned_by: row.ownedBy ?? row.family ?? "local-proxy",
    };
  }

  private async resolveTarget(
    modelName: string,
  ): Promise<ResolvedUpstreamTarget> {
    const database = this.getDatabase();
    const row = await database.modelProxyModel.findUnique({
      where: { modelName },
    });
    const fallbackModels = await this.modelsService.getAll();
    const providers = await this.providerService.getAll();

    return resolveUpstreamTarget({
      database,
      modelName,
      providers,
      fallbackModels,
      row,
    });
  }

  private extractUpstreamRequestId(
    payload: unknown,
    response: Response,
  ): string | undefined {
    const root = payload ? toObject(payload) : null;
    const payloadId =
      typeof root?.id === "string" && root.id.trim() ? root.id : undefined;
    if (payloadId) {
      return payloadId;
    }

    const headerId =
      response.headers.get("x-request-id") ??
      response.headers.get("openai-request-id");
    return headerId?.trim() ? headerId.trim() : undefined;
  }

  private extractUpstreamRequestIdFromStream(
    buffer: string,
  ): string | undefined {
    const matches = buffer.match(/"id"\s*:\s*"([^"]+)"/);
    return matches?.[1];
  }
}

export function createModelProxyService(
  options: ModelProxyServiceOptions,
): IModelProxyService {
  return new ModelProxyService(options);
}

// Re-export for tests that assert cost calculation behavior.
export { calculateCost };
