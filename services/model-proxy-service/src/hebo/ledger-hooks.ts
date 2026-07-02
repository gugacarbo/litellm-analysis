import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { GatewayHooks } from "@hebo-ai/gateway";
import type { IOpenAiOAuthService } from "@lite-llm/model-proxy-registry-service";
import { db } from "@lite-llm/database/client";
import { modelProxyModels } from "@lite-llm/database/schema/model-proxy";
import { eq } from "drizzle-orm";
import type { IModelService, IProviderService } from "@lite-llm/models-service";
import { redactHeaders } from "../logging/payload-redactor";
import {
  createCancelledError,
  createUpstreamNetworkError,
  trimErrorMessage,
} from "../logging/request-errors";
import type { RequestLedger } from "../logging/request-ledger";
import {
  extractUsage,
  readUsageFromStreamBuffer,
  type UsageSummary,
} from "../logging/usage-extractor";
import { extractEndUser } from "../proxy-payload";
import {
  type ResolvedUpstreamTarget,
  resolveUpstreamTarget,
} from "../resolver/upstream-provider";
import type { HeboGatewayBuildResult } from "./build-config";
import { sanitizeHeboRequestBody } from "./sanitize-request-body";

const FIFTY_MB = 50 * 1024 * 1024;

interface LedgerState {
  requestRowId: string;
  startedAt: Date;
  target: ResolvedUpstreamTarget;
}

function isChatGptSubscriptionTarget(target: ResolvedUpstreamTarget): boolean {
  return target.authMode === "openai-chatgpt-oauth";
}

function isLedgerOperation(
  operation: string | undefined,
): operation is "chat" | "responses" {
  return operation === "chat" || operation === "responses";
}

function readModelFromBody(body: unknown): string | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return null;
  }

  const model = (body as Record<string, unknown>).model;
  return typeof model === "string" && model.trim() ? model.trim() : null;
}

async function resolveTargetForModel(
  modelName: string,
  build: HeboGatewayBuildResult,
  options: {
    modelsService: IModelService;
    providerService: IProviderService;
  },
): Promise<ResolvedUpstreamTarget> {
  const cached = build.targetsByModel.get(modelName);
  if (cached) {
    return cached;
  }

  const [row] = await db.select()
    .from(modelProxyModels)
    .where(eq(modelProxyModels.modelName, modelName))
    .limit(1);
  const providers = await options.providerService.getAll();
  const fallbackModels = await options.modelsService.getAll();

  return resolveUpstreamTarget({
    modelName,
    providers,
    fallbackModels,
    row,
  });
}

function readPathname(request: Request): string {
  return new URL(request.url).pathname;
}

async function readModelFromRequest(request: Request): Promise<string | null> {
  try {
    const body = (await request.clone().json()) as unknown;
    return readModelFromBody(body);
  } catch {
    return null;
  }
}

function normalizeChatGptResponsesBody(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const include = Array.isArray(body.include) ? [...body.include] : [];
  if (!include.includes("reasoning.encrypted_content")) {
    include.push("reasoning.encrypted_content");
  }

  const trimmed: Record<string, unknown> = {
    model: body.model,
    input: body.input,
    instructions: body.instructions,
    stream: true,
    store: false,
    include,
    tools: body.tools,
    tool_choice: body.tool_choice,
    reasoning: body.reasoning,
    previous_response_id: body.previous_response_id,
    truncation: body.truncation,
  };

  return Object.fromEntries(
    Object.entries(trimmed).filter(([, value]) => value !== undefined),
  );
}

function toResponse(response: Response | ResponseInit): Response {
  return response instanceof Response ? response : new Response(null, response);
}

async function finishLedgerFromResult(
  ledger: RequestLedger,
  state: LedgerState,
  result: unknown,
  startedAt: Date,
): Promise<void> {
  const finishedAt = new Date();
  const latencyMs = finishedAt.getTime() - startedAt.getTime();
  const usage = extractUsage(result);

  await ledger.complete(state.requestRowId, state.target, {
    status: "success",
    finishedAt,
    latencyMs,
    usage,
    responseBody: result,
  });
}

function wrapStreamForLedger(
  body: ReadableStream<Uint8Array>,
  ledger: RequestLedger,
  state: LedgerState,
  responseHeaders: Headers,
): ReadableStream<Uint8Array> {
  const startedAt = state.startedAt;
  const decoder = new TextDecoder();
  let buffer = "";
  let ttftMs: number | undefined;
  let usage: UsageSummary = {};
  let finished = false;

  const finishOnce = async (status: "success" | "cancelled" | "failed") => {
    if (finished) {
      return;
    }
    finished = true;

    const finishedAt = new Date();
    const latencyMs = finishedAt.getTime() - startedAt.getTime();

    if (status === "success") {
      usage = readUsageFromStreamBuffer(buffer, usage);
      await ledger.complete(state.requestRowId, state.target, {
        status: "success",
        finishedAt,
        latencyMs,
        ttftMs,
        usage,
        responseHeaders: redactHeaders(responseHeaders),
      });
      return;
    }

    if (status === "cancelled") {
      await ledger.cancel(state.requestRowId, state.target, {
        status: "cancelled",
        finishedAt,
        latencyMs,
        ttftMs,
        usage,
        error: createCancelledError("Client disconnected"),
        responseHeaders: redactHeaders(responseHeaders),
      });
      return;
    }

    await ledger.fail(state.requestRowId, state.target, {
      status: "failed",
      finishedAt,
      latencyMs,
      ttftMs,
      usage,
      error: createUpstreamNetworkError("Streaming response failed"),
      responseHeaders: redactHeaders(responseHeaders),
    });
  };

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = body.getReader();
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) {
            break;
          }

          if (ttftMs === undefined) {
            ttftMs = Date.now() - startedAt.getTime();
          }

          buffer += decoder.decode(chunk.value, { stream: true });
          usage = readUsageFromStreamBuffer(buffer, usage);
          controller.enqueue(chunk.value);
        }

        buffer += decoder.decode();
        usage = readUsageFromStreamBuffer(buffer, usage);
        await finishOnce("success");
        controller.close();
      } catch (error) {
        await finishOnce("failed");
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
    async cancel() {
      await finishOnce("cancelled");
    },
  });
}

export function createLedgerHooks(options: {
  build: HeboGatewayBuildResult;
  ledger: RequestLedger;
  modelsService: IModelService;
  providerService: IProviderService;
  openAiOAuthService: IOpenAiOAuthService;
}): GatewayHooks {

  return {
    onRequest: async (ctx) => {
      const pathname = readPathname(ctx.request);
      if (!pathname.endsWith("/chat/completions")) {
        return;
      }

      const modelName = await readModelFromRequest(ctx.request);
      if (!modelName) {
        return;
      }

      const target = await resolveTargetForModel(modelName, options.build, {
        modelsService: options.modelsService,
        providerService: options.providerService,
      });

      if (!isChatGptSubscriptionTarget(target)) {
        return;
      }

      return Response.json(
        {
          error:
            "This model is configured for OpenAI OAuth and only supports /v1/responses",
        },
        { status: 400 },
      );
    },
    before: async (ctx) => {
      if (!isLedgerOperation(ctx.operation)) {
        return;
      }

      const modelName = readModelFromBody(ctx.body);
      if (!modelName) {
        return;
      }

      const startedAt = new Date();
      const target = await resolveTargetForModel(modelName, options.build, {
        modelsService: options.modelsService,
        providerService: options.providerService,
      });

      const pathname = readPathname(ctx.request);
      const sanitizedBody = sanitizeHeboRequestBody(ctx.body, {
        path: pathname,
      }) as typeof ctx.body;
      const normalizedBody =
        isChatGptSubscriptionTarget(target) && ctx.operation === "responses"
          ? normalizeChatGptResponsesBody(
              sanitizedBody as Record<string, unknown>,
            )
          : sanitizedBody;

      const requestRow = await options.ledger.startTransparent(
        modelName,
        normalizedBody,
        target,
        startedAt,
        {
          apiKeyAlias:
            typeof ctx.state.apiKeyAlias === "string"
              ? ctx.state.apiKeyAlias
              : undefined,
          endUser: extractEndUser(ctx.body),
        },
      );

      ctx.state.ledger = {
        requestRowId: requestRow.id,
        startedAt,
        target,
      } satisfies LedgerState;

      return normalizedBody as typeof ctx.body;
    },
    resolveProvider: async (ctx) => {
      const modelName = readModelFromBody(ctx.body);
      if (!modelName) {
        return;
      }

      const target = await resolveTargetForModel(modelName, options.build, {
        modelsService: options.modelsService,
        providerService: options.providerService,
      });
      if (!isChatGptSubscriptionTarget(target)) {
        return;
      }

      const auth =
        await options.openAiOAuthService.getAuthenticatedRequestConfig();

      return createOpenAICompatible({
        name: `oauth-${modelName}`,
        baseURL: auth.baseUrl,
        apiKey: auth.accessToken,
        headers: auth.headers,
      });
    },
    onResponse: async (ctx) => {
      const ledgerState = ctx.state.ledger as LedgerState | undefined;
      if (!ledgerState) {
        return;
      }

      const response = toResponse(ctx.response);
      if (ctx.result && !(ctx.result instanceof ReadableStream)) {
        await finishLedgerFromResult(
          options.ledger,
          ledgerState,
          ctx.result,
          ledgerState.startedAt,
        );
        return;
      }

      if (!response.body) {
        await options.ledger.fail(
          ledgerState.requestRowId,
          ledgerState.target,
          {
            status: "failed",
            finishedAt: new Date(),
            latencyMs: Date.now() - ledgerState.startedAt.getTime(),
            error: createUpstreamNetworkError("Empty upstream response body"),
            responseHeaders: redactHeaders(response.headers),
          },
        );
        return;
      }

      const wrappedBody = wrapStreamForLedger(
        response.body,
        options.ledger,
        ledgerState,
        response.headers,
      );

      return new Response(wrappedBody, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    },
    onError: async (ctx) => {
      const ledgerState = ctx.state.ledger as LedgerState | undefined;
      if (!ledgerState) {
        return;
      }

      const finishedAt = new Date();
      await options.ledger.fail(ledgerState.requestRowId, ledgerState.target, {
        status: "failed",
        finishedAt,
        latencyMs: finishedAt.getTime() - ledgerState.startedAt.getTime(),
        error: createUpstreamNetworkError(trimErrorMessage(String(ctx.error))),
      });
    },
  };
}

export const HEBO_MAX_BODY_SIZE = FIFTY_MB;
