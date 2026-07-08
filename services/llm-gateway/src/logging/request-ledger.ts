import { randomUUID } from "node:crypto";
import { db } from "@lite-llm/database/client";
import {
  modelProxyMessages,
  modelProxyRequests,
} from "@lite-llm/database/schema/model-proxy";
import { eq } from "drizzle-orm";
import { extractEndUser, extractLedgerMessages } from "../proxy-payload";
import type { ChatCompletionsRequest } from "../schemas";
import { type CostSnapshot, calculateCost } from "./cost-calculator";
import { redactHeaders, redactPayload } from "./payload-redactor";
import type { StructuredError } from "./request-errors";
import { trimErrorMessage } from "./request-errors";
import type { UsageSummary } from "./usage-extractor";

type RequestFinishStatus = "success" | "failed" | "cancelled" | "timeout";

const TERMINAL_REQUEST_STATUSES = new Set<string>([
  "success",
  "failed",
  "cancelled",
  "timeout",
]);

export interface LedgerTarget {
  cost: { input?: number; output?: number };
  model: string;
  upstreamBaseUrl: string;
  upstreamModel: string;
}

export interface FinishRequestParams {
  error?: StructuredError;
  finishedAt: Date;
  latencyMs: number;
  responseBody?: unknown;
  responseHeaders?: Record<string, string>;
  status: RequestFinishStatus;
  ttftMs?: number;
  upstreamRequestId?: string;
  usage?: UsageSummary;
}

export interface LedgerStartContext {
  apiKeyAlias?: string | null;
  endUser?: string | null;
}

type RequestFinishedListener = (requestId: string) => void;

export class RequestLedger {
  private readonly listeners = new Set<RequestFinishedListener>();

  onRequestFinished(listener: RequestFinishedListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async start(
    request: ChatCompletionsRequest,
    target: LedgerTarget,
    startedAt: Date,
    context: LedgerStartContext = {},
  ): Promise<typeof modelProxyRequests.$inferSelect> {
    return this.startWithMessages(
      {
        model: request.model,
        user: request.user,
        messages: request.messages,
        requestBody: request,
      },
      target,
      startedAt,
      context,
    );
  }

  async startResponses(
    request: { model: string; input: unknown; user?: string },
    target: LedgerTarget,
    startedAt: Date,
    context: LedgerStartContext = {},
  ): Promise<typeof modelProxyRequests.$inferSelect> {
    return this.startTransparent(request.model, request, target, startedAt, {
      apiKeyAlias: context.apiKeyAlias,
      endUser: context.endUser ?? request.user,
    });
  }

  async startTransparent(
    model: string,
    requestBody: unknown,
    target: LedgerTarget,
    startedAt: Date,
    context: LedgerStartContext = {},
  ): Promise<typeof modelProxyRequests.$inferSelect> {
    return this.startWithMessages(
      {
        model,
        user: extractEndUser(requestBody),
        messages: extractLedgerMessages(requestBody),
        requestBody,
      },
      target,
      startedAt,
      context,
    );
  }

  private async startWithMessages(
    request: {
      model: string;
      user?: string;
      messages: Array<{ role: string; content: unknown }>;
      requestBody: unknown;
    },
    target: LedgerTarget,
    startedAt: Date,
    context: LedgerStartContext = {},
  ): Promise<typeof modelProxyRequests.$inferSelect> {
    const [row] = await db
      .insert(modelProxyRequests)
      .values({
        id: randomUUID(),
        model: request.model,
        upstreamModel: target.upstreamModel,
        upstreamBaseUrl: target.upstreamBaseUrl,
        status: "started",
        startedAt,
        apiKeyAlias: context.apiKeyAlias ?? null,
        endUser: context.endUser ?? request.user ?? null,
        requestBody: redactPayload(request.requestBody) as unknown,
      })
      .returning();

    if (request.messages.length > 0) {
      await db.insert(modelProxyMessages).values(
        request.messages.map((message) => ({
          id: randomUUID(),
          requestId: row.id,
          role: message.role,
          content: redactPayload(message.content) as unknown,
        })),
      );
    }

    return row;
  }

  async complete(
    requestId: string,
    target: LedgerTarget,
    params: FinishRequestParams,
  ): Promise<void> {
    await this.finish(requestId, target, params);
  }

  async fail(
    requestId: string,
    target: LedgerTarget,
    params: FinishRequestParams,
  ): Promise<void> {
    await this.finish(requestId, target, params);
  }

  async cancel(
    requestId: string,
    target: LedgerTarget,
    params: FinishRequestParams,
  ): Promise<void> {
    await this.finish(requestId, target, params);
  }

  async timeout(
    requestId: string,
    target: LedgerTarget,
    params: FinishRequestParams,
  ): Promise<void> {
    await this.finish(requestId, target, params);
  }

  private async finish(
    requestId: string,
    target: LedgerTarget,
    params: FinishRequestParams,
  ): Promise<void> {
    const [existing] = await db
      .select({ status: modelProxyRequests.status })
      .from(modelProxyRequests)
      .where(eq(modelProxyRequests.id, requestId))
      .limit(1);

    if (existing?.status && TERMINAL_REQUEST_STATUSES.has(existing.status)) {
      return;
    }

    const usage = params.usage ?? {};
    const cost = calculateCost(target.cost, usage);

    await db
      .update(modelProxyRequests)
      .set(this.buildUpdateData(params, cost))
      .where(eq(modelProxyRequests.id, requestId));

    for (const listener of this.listeners) {
      listener(requestId);
    }
  }

  private buildUpdateData(
    params: FinishRequestParams,
    cost: CostSnapshot,
  ): Record<string, unknown> {
    const error = params.error;

    return {
      status: params.status,
      finishedAt: params.finishedAt,
      latencyMs: params.latencyMs,
      ttftMs: params.ttftMs,
      inputTokens: params.usage?.inputTokens,
      outputTokens: params.usage?.outputTokens,
      totalTokens: params.usage?.totalTokens,
      cachedTokens: params.usage?.cachedTokens,
      reasoningTokens: params.usage?.reasoningTokens,
      usageEstimated: params.usage?.usageEstimated,
      inputCostPerToken: cost.inputCostPerToken,
      outputCostPerToken: cost.outputCostPerToken,
      inputCost: cost.inputCost,
      outputCost: cost.outputCost,
      totalCost: cost.totalCost,
      costEstimated: cost.costEstimated,
      estimatedCostUsd: cost.estimatedCostUsd,
      errorSummary: error
        ? trimErrorMessage(error.message)
        : params.status === "cancelled"
          ? "Request cancelled"
          : undefined,
      errorType: error?.type,
      errorMessage: error?.message,
      errorStatusCode: error?.statusCode,
      errorDetails:
        error?.details !== undefined
          ? (redactPayload(error.details) as unknown)
          : undefined,
      responseBody:
        params.responseBody !== undefined
          ? (redactPayload(params.responseBody) as unknown)
          : undefined,
      responseHeaders: params.responseHeaders
        ? redactHeaders(params.responseHeaders)
        : undefined,
      upstreamRequestId: params.upstreamRequestId,
    };
  }
}
