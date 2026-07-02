import type { PrismaClient } from "@lite-llm/model-proxy-repository";
import { getModelProxyPrisma } from "@lite-llm/model-proxy-repository";
import type { IModelService, IProviderService } from "@lite-llm/models-service";
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
  extractEndUser,
  extractModelName,
  injectUpstreamModel,
  isStreamingRequest,
  MissingProxyModelError,
} from "./proxy-payload";
import {
  type ResolvedUpstreamTarget,
  resolveUpstreamTarget,
} from "./resolver/upstream-provider";
import type {
  ChatCompletionsRequest,
  ModelListEntry,
  ModelListResponse,
  ResponsesRequest,
} from "./schemas";
import type {
  IModelProxyService,
  ModelProxyServiceOptions,
  ProxyEndpointResult,
  ProxyRequestContext,
  ProxyResponse,
  StreamingProxyResponse,
} from "./types";

function withStreamEnabled(body: unknown): unknown {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return body;
  }

  return {
    ...(body as Record<string, unknown>),
    stream: true,
  };
}

function buildUpstreamUrl(baseUrl: string, endpoint: string): string {
  const suffix = `/${endpoint}`;
  if (baseUrl.endsWith(suffix)) {
    return baseUrl;
  }
  return `${baseUrl}${suffix}`;
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

  async proxyOpenAiEndpoint(
    endpoint: string,
    rawBody: unknown,
    signal?: AbortSignal,
    context: ProxyRequestContext = {},
  ): Promise<ProxyEndpointResult> {
    const model = extractModelName(rawBody);
    if (!model) {
      throw new MissingProxyModelError();
    }

    const target = await this.resolveTarget(model);
    const upstreamBody = injectUpstreamModel(rawBody, target.upstreamModel);
    const startedAt = this.now();
    const requestRow = await this.ledger.startTransparent(
      model,
      upstreamBody,
      target,
      startedAt,
      {
        apiKeyAlias: context.apiKeyAlias,
        endUser: extractEndUser(rawBody),
      },
    );

    if (isStreamingRequest(rawBody)) {
      return {
        kind: "stream",
        response: await this.forwardStreamingRequest(
          endpoint,
          upstreamBody,
          target,
          requestRow.id,
          startedAt,
          signal,
        ),
      };
    }

    return {
      kind: "json",
      response: await this.forwardJsonRequest(
        endpoint,
        upstreamBody,
        target,
        requestRow.id,
        startedAt,
        signal,
      ),
    };
  }

  async createChatCompletion(
    rawRequest: ChatCompletionsRequest | unknown,
    signal?: AbortSignal,
    context: ProxyRequestContext = {},
  ): Promise<ProxyResponse> {
    const result = await this.proxyOpenAiEndpoint(
      "chat/completions",
      rawRequest,
      signal,
      context,
    );
    if (result.kind !== "json") {
      throw new Error("Expected non-streaming response");
    }
    return result.response;
  }

  async createStreamingChatCompletion(
    rawRequest: ChatCompletionsRequest | unknown,
    signal?: AbortSignal,
    context: ProxyRequestContext = {},
  ): Promise<StreamingProxyResponse> {
    const body = withStreamEnabled(rawRequest);
    const result = await this.proxyOpenAiEndpoint(
      "chat/completions",
      body,
      signal,
      context,
    );
    if (result.kind !== "stream") {
      throw new Error("Expected streaming response");
    }
    return result.response;
  }

  async createResponse(
    rawRequest: ResponsesRequest | unknown,
    signal?: AbortSignal,
    context: ProxyRequestContext = {},
  ): Promise<ProxyResponse> {
    const result = await this.proxyOpenAiEndpoint(
      "responses",
      rawRequest,
      signal,
      context,
    );
    if (result.kind !== "json") {
      throw new Error("Expected non-streaming response");
    }
    return result.response;
  }

  async createStreamingResponse(
    rawRequest: ResponsesRequest | unknown,
    signal?: AbortSignal,
    context: ProxyRequestContext = {},
  ): Promise<StreamingProxyResponse> {
    const body = withStreamEnabled(rawRequest);
    const result = await this.proxyOpenAiEndpoint(
      "responses",
      body,
      signal,
      context,
    );
    if (result.kind !== "stream") {
      throw new Error("Expected streaming response");
    }
    return result.response;
  }

  private async forwardJsonRequest(
    endpoint: string,
    upstreamBody: unknown,
    target: ResolvedUpstreamTarget,
    requestRowId: string,
    startedAt: Date,
    signal?: AbortSignal,
  ): Promise<ProxyResponse> {
    const requestSignal = createRequestAbortSignal(signal);

    try {
      const response = await this.fetchFn(
        buildUpstreamUrl(target.upstreamBaseUrl, endpoint),
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...target.upstreamHeaders,
          },
          body: JSON.stringify(upstreamBody),
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
        await this.ledger.fail(requestRowId, target, {
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
        await this.ledger.fail(requestRowId, target, {
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
      await this.ledger.complete(requestRowId, target, {
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
          requestRowId,
          target,
          startedAt,
          error,
          undefined,
        );
      }
      throw unwrapLedgerHandledError(error);
    }
  }

  private async forwardStreamingRequest(
    endpoint: string,
    upstreamBody: unknown,
    target: ResolvedUpstreamTarget,
    requestRowId: string,
    startedAt: Date,
    signal?: AbortSignal,
  ): Promise<StreamingProxyResponse> {
    const upstreamAbort = new AbortController();
    const requestSignal = mergeAbortSignals(
      signal,
      upstreamAbort.signal,
      AbortSignal.timeout(DEFAULT_REQUEST_TIMEOUT_MS),
    );

    let response: Response;
    try {
      response = await this.fetchFn(
        buildUpstreamUrl(target.upstreamBaseUrl, endpoint),
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...target.upstreamHeaders,
          },
          body: JSON.stringify(upstreamBody),
          signal: requestSignal,
        },
      );
    } catch (error) {
      await this.handleRequestError(
        requestRowId,
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
      await this.ledger.fail(requestRowId, target, {
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
            this.ledger.complete(requestRowId, target, {
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
            this.handleRequestError(requestRowId, target, startedAt, error, {
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
          this.ledger.cancel(requestRowId, target, {
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
    const fallbackModels = await this.modelsService.getAll();
    const providers = await this.providerService.getAll();

    return resolveUpstreamTarget({
      database,
      modelName,
      providers,
      fallbackModels,
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
