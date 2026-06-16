import { serverEnv } from "@lite-llm/config/server";
import type {
  ModelProxyModel,
  ModelProxyRequest,
} from "@lite-llm/model-proxy-repository";
import {
  getModelProxyPrisma,
  type Prisma,
  type PrismaClient,
} from "@lite-llm/model-proxy-repository";
import type { IModelService } from "@lite-llm/models-service";
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

interface ResolvedModelTarget {
  cost: { input?: number; output?: number };
  displayName?: string;
  model: string;
  ownedBy: string;
  upstreamBaseUrl: string;
  upstreamHeaders: HeadersInit;
  upstreamModel: string;
}

interface UsageSummary {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "");
}

function buildChatCompletionsUrl(baseUrl: string): string {
  const normalized = normalizeBaseUrl(baseUrl);
  if (normalized.endsWith("/chat/completions")) {
    return normalized;
  }
  return `${normalized}/chat/completions`;
}

function toObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function readUsage(payload: unknown): UsageSummary {
  const root = toObject(payload);
  const usage = toObject(root?.usage);
  if (!usage) {
    return {};
  }

  const inputTokens =
    typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : undefined;
  const outputTokens =
    typeof usage.completion_tokens === "number"
      ? usage.completion_tokens
      : undefined;
  const totalTokens =
    typeof usage.total_tokens === "number" ? usage.total_tokens : undefined;

  return { inputTokens, outputTokens, totalTokens };
}

function estimateCostUsd(
  cost: { input?: number; output?: number },
  usage: UsageSummary,
): number | undefined {
  const promptCost =
    usage.inputTokens !== undefined && cost.input !== undefined
      ? usage.inputTokens * cost.input
      : 0;
  const completionCost =
    usage.outputTokens !== undefined && cost.output !== undefined
      ? usage.outputTokens * cost.output
      : 0;
  const total = promptCost + completionCost;
  return total > 0 ? total : undefined;
}

function trimErrorMessage(message: string): string {
  return message.length > 500 ? message.slice(0, 500) : message;
}

function sanitizeHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of headers.entries()) {
    const lower = key.toLowerCase();
    if (lower === "authorization" || lower === "x-api-key") {
      continue;
    }
    result[key] = value;
  }
  return result;
}

function readSecretRef(secretRef?: string | null): string | undefined {
  const trimmed = secretRef?.trim();
  if (!trimmed) {
    return undefined;
  }
  const envValue = process.env[trimmed];
  return envValue?.trim() ? envValue.trim() : undefined;
}

export class ModelProxyService implements IModelProxyService {
  private readonly database?: PrismaClient;
  private readonly fetchFn: typeof fetch;
  private readonly modelsService: IModelService;
  private readonly now: () => Date;

  constructor(options: ModelProxyServiceOptions) {
    this.database = options.database;
    this.fetchFn = options.fetchFn ?? fetch;
    this.modelsService = options.modelsService;
    this.now = options.now ?? (() => new Date());
  }

  private getDatabase(): PrismaClient {
    return this.database ?? getModelProxyPrisma();
  }

  async listModels(): Promise<ModelListResponse> {
    const database = this.getDatabase();
    const proxyModels = await database.modelProxyModel.findMany({
      where: { enabled: true },
      orderBy: { modelName: "asc" },
    });

    const modelEntries =
      proxyModels.length > 0
        ? proxyModels.map((row: ModelProxyModel) => this.toModelListEntry(row))
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
    const requestRow = await this.createRequestRow(request, target, startedAt);

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
          signal,
        },
      );

      const responseText = await response.text();
      const finishedAt = this.now();
      const latencyMs = finishedAt.getTime() - startedAt.getTime();

      if (!response.ok) {
        await this.finishRequest(requestRow.id, {
          status: "failed",
          finishedAt,
          latencyMs,
          errorSummary: trimErrorMessage(responseText),
          responseHeaders: sanitizeHeaders(response.headers),
        });
        throw new Error(
          `Model proxy upstream failed (${response.status}): ${trimErrorMessage(responseText)}`,
        );
      }

      const payload = JSON.parse(responseText) as unknown;
      const usage = readUsage(payload);
      const estimatedCostUsd = estimateCostUsd(target.cost, usage);

      await this.finishRequest(requestRow.id, {
        status: "success",
        finishedAt,
        latencyMs,
        usage,
        estimatedCostUsd,
        responseBody: payload,
        responseHeaders: sanitizeHeaders(response.headers),
        upstreamRequestId: this.extractUpstreamRequestId(payload, response),
      });

      return {
        status: response.status,
        headers: new Headers(response.headers),
        payload,
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        await this.finishRequest(requestRow.id, {
          status: "failed",
          finishedAt: this.now(),
          latencyMs: this.now().getTime() - startedAt.getTime(),
          errorSummary: "Failed to parse upstream JSON response",
        });
      } else if ((error as Error).name === "AbortError") {
        await this.finishRequest(requestRow.id, {
          status: "cancelled",
          finishedAt: this.now(),
          latencyMs: this.now().getTime() - startedAt.getTime(),
          errorSummary: "Request cancelled",
        });
      } else {
        await this.finishRequest(requestRow.id, {
          status: "failed",
          finishedAt: this.now(),
          latencyMs: this.now().getTime() - startedAt.getTime(),
          errorSummary: trimErrorMessage(String(error)),
        });
      }

      throw error;
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
    const requestRow = await this.createRequestRow(request, target, startedAt);
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
          signal,
        },
      );
    } catch (error) {
      await this.finishRequest(requestRow.id, {
        status: (error as Error).name === "AbortError" ? "cancelled" : "failed",
        finishedAt: this.now(),
        latencyMs: this.now().getTime() - startedAt.getTime(),
        errorSummary: trimErrorMessage(String(error)),
      });
      throw error;
    }

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      await this.finishRequest(requestRow.id, {
        status: "failed",
        finishedAt: this.now(),
        latencyMs: this.now().getTime() - startedAt.getTime(),
        errorSummary: trimErrorMessage(errorText || `HTTP ${response.status}`),
        responseHeaders: sanitizeHeaders(response.headers),
      });
      throw new Error(
        `Model proxy upstream failed (${response.status}): ${trimErrorMessage(errorText)}`,
      );
    }

    const usage: UsageSummary = {};
    let ttftMs: number | undefined;
    let upstreamRequestId: string | undefined;

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

            if (ttftMs === undefined) {
              ttftMs = this.now().getTime() - startedAt.getTime();
            }

            controller.enqueue(result.value);
            buffer += decoder.decode(result.value, { stream: true });
            upstreamRequestId ??=
              this.extractUpstreamRequestIdFromStream(buffer) ??
              this.extractUpstreamRequestId(null, response);
            this.readUsageFromStreamBuffer(buffer, usage);
          }

          buffer += decoder.decode();
          this.readUsageFromStreamBuffer(buffer, usage);
          const finishedAt = this.now();
          const latencyMs = finishedAt.getTime() - startedAt.getTime();
          await this.finishRequest(requestRow.id, {
            status: "success",
            finishedAt,
            latencyMs,
            ttftMs,
            usage,
            estimatedCostUsd: estimateCostUsd(target.cost, usage),
            responseHeaders: sanitizeHeaders(response.headers),
            upstreamRequestId,
          });
          controller.close();
        } catch (error) {
          await this.finishRequest(requestRow.id, {
            status:
              (error as Error).name === "AbortError" ? "cancelled" : "failed",
            finishedAt: this.now(),
            latencyMs: this.now().getTime() - startedAt.getTime(),
            ttftMs,
            usage,
            estimatedCostUsd: estimateCostUsd(target.cost, usage),
            errorSummary: trimErrorMessage(String(error)),
            responseHeaders: sanitizeHeaders(response.headers),
            upstreamRequestId,
          });
          controller.error(error);
        }
      },
      cancel: async () => {
        await this.finishRequest(requestRow.id, {
          status: "cancelled",
          finishedAt: this.now(),
          latencyMs: this.now().getTime() - startedAt.getTime(),
          ttftMs,
          usage,
          estimatedCostUsd: estimateCostUsd(target.cost, usage),
          errorSummary: "Client disconnected",
          responseHeaders: sanitizeHeaders(response.headers),
          upstreamRequestId,
        });
      },
    });

    return {
      status: response.status,
      headers: new Headers(response.headers),
      body: stream,
    };
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

  private toModelListEntry(row: ModelProxyModel): ModelListEntry {
    return {
      id: row.modelName,
      object: "model",
      created: Math.floor(row.updatedAt.getTime() / 1000),
      owned_by: row.ownedBy ?? row.family ?? "local-proxy",
    };
  }

  private async resolveTarget(modelName: string): Promise<ResolvedModelTarget> {
    const database = this.getDatabase();
    const row = await database.modelProxyModel.findUnique({
      where: { modelName },
    });

    if (row?.enabled === false) {
      throw new Error(`Model "${modelName}" is disabled`);
    }

    const fallbackModels = await this.modelsService.getAll();
    const fallbackSpec = fallbackModels[modelName];

    if (!row && !fallbackSpec) {
      throw new Error(`Model "${modelName}" not found`);
    }

    const credential = row?.credentialName
      ? await database.modelProxyCredential.findUnique({
          where: { name: row.credentialName },
        })
      : null;

    const upstreamBaseUrl =
      row?.upstreamBaseUrl?.trim() ||
      credential?.baseUrl?.trim() ||
      serverEnv.MODEL_PROXY_UPSTREAM_BASE_URL?.trim();

    if (!upstreamBaseUrl) {
      throw new Error(
        `No upstream base URL configured for model "${modelName}"`,
      );
    }

    const envSecret =
      readSecretRef(row?.secretRef) ?? readSecretRef(credential?.secretRef);
    const upstreamApiKey =
      envSecret ||
      credential?.apiKey?.trim() ||
      serverEnv.MODEL_PROXY_UPSTREAM_API_KEY?.trim();

    if (!upstreamApiKey) {
      throw new Error(
        `No upstream API key configured for model "${modelName}"`,
      );
    }

    return {
      model: modelName,
      upstreamModel: row?.upstreamModel?.trim() || modelName,
      upstreamBaseUrl,
      upstreamHeaders: {
        authorization: `Bearer ${upstreamApiKey}`,
      },
      ownedBy:
        row?.ownedBy ??
        fallbackSpec?.ownedBy ??
        fallbackSpec?.family ??
        "local-proxy",
      displayName: row?.displayName ?? fallbackSpec?.displayName,
      cost: {
        input: row?.inputCostPerToken ?? fallbackSpec?.cost?.input,
        output: row?.outputCostPerToken ?? fallbackSpec?.cost?.output,
      },
    };
  }

  private async createRequestRow(
    request: ChatCompletionsRequest,
    target: ResolvedModelTarget,
    startedAt: Date,
  ): Promise<ModelProxyRequest> {
    const database = this.getDatabase();
    const row = await database.modelProxyRequest.create({
      data: {
        model: request.model,
        upstreamModel: target.upstreamModel,
        upstreamBaseUrl: target.upstreamBaseUrl,
        status: "started",
        startedAt,
        requestBody: request as Prisma.InputJsonValue,
      },
    });

    await database.modelProxyMessage.createMany({
      data: request.messages.map((message) => ({
        requestId: row.id,
        role: message.role,
        content: message.content as Prisma.InputJsonValue,
      })),
    });

    return row;
  }

  private async finishRequest(
    requestId: string,
    params: {
      status: string;
      finishedAt: Date;
      latencyMs: number;
      ttftMs?: number;
      usage?: UsageSummary;
      estimatedCostUsd?: number;
      errorSummary?: string;
      responseBody?: unknown;
      responseHeaders?: Record<string, string>;
      upstreamRequestId?: string;
    },
  ): Promise<void> {
    const database = this.getDatabase();
    await database.modelProxyRequest.update({
      where: { id: requestId },
      data: {
        status: params.status,
        finishedAt: params.finishedAt,
        latencyMs: params.latencyMs,
        ttftMs: params.ttftMs,
        inputTokens: params.usage?.inputTokens,
        outputTokens: params.usage?.outputTokens,
        totalTokens: params.usage?.totalTokens,
        estimatedCostUsd: params.estimatedCostUsd,
        errorSummary: params.errorSummary,
        responseBody:
          params.responseBody !== undefined
            ? (params.responseBody as object)
            : undefined,
        responseHeaders: params.responseHeaders,
        upstreamRequestId: params.upstreamRequestId,
      },
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

  private readUsageFromStreamBuffer(buffer: string, usage: UsageSummary): void {
    const lines = buffer.split("\n\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) {
        continue;
      }
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") {
        continue;
      }

      try {
        const parsed = JSON.parse(payload) as unknown;
        const summary = readUsage(parsed);
        if (summary.inputTokens !== undefined) {
          usage.inputTokens = summary.inputTokens;
        }
        if (summary.outputTokens !== undefined) {
          usage.outputTokens = summary.outputTokens;
        }
        if (summary.totalTokens !== undefined) {
          usage.totalTokens = summary.totalTokens;
        }
      } catch {
        // Ignore partial JSON fragments while the stream is still flowing.
      }
    }
  }
}

export function createModelProxyService(
  options: ModelProxyServiceOptions,
): IModelProxyService {
  return new ModelProxyService(options);
}
