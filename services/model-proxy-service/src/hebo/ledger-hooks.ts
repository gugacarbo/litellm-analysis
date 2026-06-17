import type { GatewayHooks } from "@hebo-ai/gateway";
import type { PrismaClient } from "@lite-llm/model-proxy-repository";
import { getModelProxyPrisma } from "@lite-llm/model-proxy-repository";
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

const FIFTY_MB = 50 * 1024 * 1024;

interface LedgerState {
  requestRowId: string;
  startedAt: Date;
  target: ResolvedUpstreamTarget;
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
    database: PrismaClient;
    modelsService: IModelService;
    providerService: IProviderService;
  },
): Promise<ResolvedUpstreamTarget> {
  const cached = build.targetsByModel.get(modelName);
  if (cached) {
    return cached;
  }

  const database = options.database;
  const row = await database.modelProxyModel.findUnique({
    where: { modelName },
  });
  const providers = await options.providerService.getAll();
  const fallbackModels = await options.modelsService.getAll();

  return resolveUpstreamTarget({
    database,
    modelName,
    providers,
    fallbackModels,
    row,
  });
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
  database?: PrismaClient;
  ledger: RequestLedger;
  modelsService: IModelService;
  providerService: IProviderService;
}): GatewayHooks {
  const database = options.database ?? getModelProxyPrisma();

  return {
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
        database,
        modelsService: options.modelsService,
        providerService: options.providerService,
      });

      const requestRow = await options.ledger.startTransparent(
        modelName,
        ctx.body,
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
