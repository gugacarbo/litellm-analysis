import { EventEmitter } from "node:events";
import {
  cleanupOldHealthChecks,
  insertHealthCheck,
} from "../db/monitor-queries";
import type {
  HealthCheckResult,
  HealthCheckServiceEvents,
  HealthCheckServiceOptions,
} from "./monitor-types";

const HEALTH_CHECK_MAX_TOKENS = 200;
const MAX_CAPTURED_RESPONSE_CHARS = 500;
const FIRST_TOKEN_TIMEOUT_MS = 10_000;
const HEALTH_CHECK_REASONING_EFFORT = "none";

interface ParsedChatResponse {
  choices?: Array<{
    message?: {
      content?: unknown;
      reasoning_content?: string;
      provider_specific_fields?: {
        reasoning_content?: string;
      };
    };
    provider_specific_fields?: {
      reasoning_content?: string;
    };
  }>;
  usage?: {
    completion_tokens?: number;
  };
  error?: { message?: string };
}

interface ParsedStreamChunk {
  choices?: Array<{
    delta?: {
      content?: unknown;
      reasoning_content?: string;
      provider_specific_fields?: {
        reasoning_content?: string;
      };
    };
  }>;
  usage?: {
    completion_tokens?: number;
  };
  error?: { message?: string };
}

interface StreamReadResult {
  responseText: string | null;
  ttftMs: number | null;
  completionTokens: number | null;
  responseErrorMessage: string | null;
  responsePayload: string | null;
}

interface FetchHealthCheckResponseResult {
  response: Response;
  requestPayload: string;
}

export class HealthCheckService {
  private options: HealthCheckServiceOptions;
  private emitter = new EventEmitter();
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(options: HealthCheckServiceOptions) {
    this.options = options;
  }

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.tick();
    this.timer = setInterval(() => this.tick(), this.options.pollIntervalMs);
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  on<K extends keyof HealthCheckServiceEvents>(
    event: K,
    listener: HealthCheckServiceEvents[K],
  ): void {
    this.emitter.on(event, listener as (...args: unknown[]) => void);
  }

  async runCheck(
    modelName: string,
    source: "scheduled" | "manual" = "scheduled",
  ): Promise<HealthCheckResult> {
    const { litellmApiUrl, litellmApiKey, prompt, timeoutMs } = this.options;
    const startTime = Date.now();
    const normalizedApiKey = litellmApiKey.trim().replace(/^Bearer\s+/i, "");
    const normalizedApiUrl = litellmApiUrl.replace(/\/+$/, "");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (normalizedApiKey) {
      headers.Authorization = `Bearer ${normalizedApiKey}`;
    }

    try {
      const fetchResult = await this.fetchHealthCheckResponse({
        normalizedApiUrl,
        headers,
        modelName,
        prompt,
        timeoutMs,
      });
      const { response, requestPayload } = fetchResult;

      const statusCode = response.status;
      const streamResult = await this.readStreamResponse(response, startTime);
      const responseTimeMs = Date.now() - startTime;
      const tokensPerSecond = this.calculateTokensPerSecond(
        streamResult.completionTokens,
        responseTimeMs,
        streamResult.ttftMs,
      );

      const status: HealthCheckResult["status"] = response.ok
        ? "healthy"
        : "unhealthy";

      const check: HealthCheckResult = {
        id: 0,
        modelName,
        status,
        responseTimeMs,
        ttftMs: streamResult.ttftMs,
        outputTokens: streamResult.completionTokens,
        tokensPerSecond,
        statusCode,
        promptSent: prompt,
        responseReceived: streamResult.responseText,
        requestPayload,
        responsePayload: streamResult.responsePayload,
        errorMessage: response.ok
          ? null
          : streamResult.responseErrorMessage ??
            `HTTP ${statusCode}: ${response.statusText}`,
        source,
        checkedAt: Math.floor(startTime / 1000),
      };

      insertHealthCheck({
        modelName,
        status: check.status,
        responseTimeMs: check.responseTimeMs,
        ttftMs: check.ttftMs,
        outputTokens: check.outputTokens,
        tokensPerSecond: check.tokensPerSecond,
        statusCode: check.statusCode,
        promptSent: check.promptSent,
        responseReceived: check.responseReceived,
        requestPayload: check.requestPayload,
        responsePayload: check.responsePayload,
        errorMessage: check.errorMessage,
        source: check.source,
        checkedAt: check.checkedAt,
      });

      return check;
    } catch (err) {
      const responseTimeMs = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      const check: HealthCheckResult = {
        id: 0,
        modelName,
        status: "error",
        responseTimeMs,
        ttftMs: null,
        outputTokens: null,
        tokensPerSecond: null,
        statusCode: null,
        promptSent: prompt,
        responseReceived: null,
        requestPayload: null,
        responsePayload: null,
        errorMessage,
        source,
        checkedAt: Math.floor(startTime / 1000),
      };

      insertHealthCheck({
        modelName,
        status: check.status,
        responseTimeMs: check.responseTimeMs,
        ttftMs: check.ttftMs,
        outputTokens: check.outputTokens,
        tokensPerSecond: check.tokensPerSecond,
        statusCode: check.statusCode,
        promptSent: check.promptSent,
        responseReceived: check.responseReceived,
        requestPayload: check.requestPayload,
        responsePayload: check.responsePayload,
        errorMessage: check.errorMessage,
        source: check.source,
        checkedAt: check.checkedAt,
      });

      return check;
    }
  }

  private async fetchHealthCheckResponse({
    normalizedApiUrl,
    headers,
    modelName,
    prompt,
    timeoutMs,
  }: {
    normalizedApiUrl: string;
    headers: Record<string, string>;
    modelName: string;
    prompt: string;
    timeoutMs: number;
  }): Promise<FetchHealthCheckResponseResult> {
    const url = `${normalizedApiUrl}/chat/completions`;
    const attempts: Array<Record<string, unknown>> = [];

    const requestBody = this.buildHealthCheckRequestBody({
      modelName,
      prompt,
      includeReasoningEffort: true,
    });
    attempts.push(this.buildRequestAttemptSnapshot(url, headers, requestBody));

    const withReasoningDisabled = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!(await this.shouldRetryWithoutReasoningEffort(withReasoningDisabled))) {
      return {
        response: withReasoningDisabled,
        requestPayload: JSON.stringify({ attempts }),
      };
    }

    const retryBody = this.buildHealthCheckRequestBody({
      modelName,
      prompt,
      includeReasoningEffort: false,
    });
    attempts.push(this.buildRequestAttemptSnapshot(url, headers, retryBody));

    const retryResponse = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(retryBody),
      signal: AbortSignal.timeout(timeoutMs),
    });

    return {
      response: retryResponse,
      requestPayload: JSON.stringify({
        attempts,
        fallbackUsed: true,
      }),
    };
  }

  private buildRequestAttemptSnapshot(
    url: string,
    headers: Record<string, string>,
    body: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      method: "POST",
      url,
      headers: this.redactHeaders(headers),
      body,
    };
  }

  private redactHeaders(headers: Record<string, string>): Record<string, string> {
    return Object.fromEntries(
      Object.entries(headers).map(([key, value]) => {
        if (key.toLowerCase() === "authorization") {
          return [key, "Bearer ***redacted***"];
        }
        return [key, value];
      }),
    );
  }

  private buildHealthCheckRequestBody({
    modelName,
    prompt,
    includeReasoningEffort,
  }: {
    modelName: string;
    prompt: string;
    includeReasoningEffort: boolean;
  }): Record<string, unknown> {
    const requestBody: Record<string, unknown> = {
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      max_tokens: HEALTH_CHECK_MAX_TOKENS,
      stream: true,
      stream_options: {
        include_usage: true,
      },
    };

    const extraBody: Record<string, unknown> = {};
    if (this.isDeepSeekModel(modelName)) {
      extraBody.thinking = { type: "disabled" };
      requestBody.thinking = { type: "disabled" };
    }
    if (this.isMiniMaxModel(modelName)) {
      extraBody.reasoning_split = true;
      requestBody.reasoning_split = true;
    }
    if (Object.keys(extraBody).length > 0) {
      requestBody.extra_body = extraBody;
    }

    if (includeReasoningEffort) {
      requestBody.reasoning_effort = HEALTH_CHECK_REASONING_EFFORT;
    }

    return requestBody;
  }

  private isDeepSeekModel(modelName: string): boolean {
    return modelName.toLowerCase().includes("deepseek");
  }

  private isMiniMaxModel(modelName: string): boolean {
    return modelName.toLowerCase().includes("minimax");
  }

  private async shouldRetryWithoutReasoningEffort(
    response: Response,
  ): Promise<boolean> {
    if (response.ok || ![400, 422].includes(response.status)) {
      return false;
    }

    const bodyText = await response
      .clone()
      .text()
      .catch(() => "");
    const normalized = bodyText.toLowerCase();

    return (
      normalized.includes("reasoning_effort") ||
      normalized.includes("reasoning effort") ||
      normalized.includes("unsupported parameter") ||
      normalized.includes("extra fields not permitted")
    );
  }

  private async readStreamResponse(
    response: Response,
    startTime: number,
  ): Promise<StreamReadResult> {
    if (!response.body) {
      return {
        responseText: null,
        ttftMs: null,
        completionTokens: null,
        responseErrorMessage: null,
        responsePayload: this.buildResponsePayload(response, ""),
      };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let rawBody = "";
    let sawStreamEvents = false;
    let firstTokenAt: number | null = null;
    let completionTokens: number | null = null;
    let responseErrorMessage: string | null = null;
    const contentParts: string[] = [];
    const reasoningParts: string[] = [];

    while (true) {
      const timeToFirstTokenMs =
        FIRST_TOKEN_TIMEOUT_MS - (Date.now() - startTime);
      if (firstTokenAt === null && timeToFirstTokenMs <= 0) {
        await reader.cancel("First token timeout");
        throw new Error("First token timeout after 10 seconds");
      }

      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const { done, value } =
        firstTokenAt === null
          ? await Promise.race([
              reader.read(),
              new Promise<never>((_, reject) => {
                timeoutId = setTimeout(() => {
                  reject(new Error("First token timeout after 10 seconds"));
                }, timeToFirstTokenMs);
              }),
            ]).finally(() => {
              if (timeoutId) {
                clearTimeout(timeoutId);
              }
            })
          : await reader.read();
      if (done) {
        break;
      }

      const chunkText = decoder.decode(value, { stream: true });
      rawBody += chunkText;
      buffer += chunkText;

      let separatorIndex = buffer.indexOf("\n\n");
      while (separatorIndex !== -1) {
        const eventBlock = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);
        this.consumeEventBlock({
          eventBlock,
          contentParts,
          reasoningParts,
          firstTokenAtRef: {
            get: () => firstTokenAt,
            set: (value) => {
              firstTokenAt = value;
            },
          },
          completionTokensRef: {
            get: () => completionTokens,
            set: (value) => {
              completionTokens = value;
            },
          },
          responseErrorMessageRef: {
            get: () => responseErrorMessage,
            set: (value) => {
              responseErrorMessage = value;
            },
          },
          onStreamEvent: () => {
            sawStreamEvents = true;
          },
        });
        separatorIndex = buffer.indexOf("\n\n");
      }
    }

    if (!sawStreamEvents) {
      return this.readNonStreamResponse(response, rawBody);
    }

    const content = contentParts.join("").trim();
    const reasoning = reasoningParts.join("").trim();

    return {
      responseText: (content || reasoning || responseErrorMessage)?.slice(
        0,
        MAX_CAPTURED_RESPONSE_CHARS,
      ) ?? null,
      ttftMs: firstTokenAt ? firstTokenAt - startTime : null,
      completionTokens,
      responseErrorMessage,
      responsePayload: this.buildResponsePayload(response, rawBody),
    };
  }

  private consumeEventBlock({
    eventBlock,
    contentParts,
    reasoningParts,
    firstTokenAtRef,
    completionTokensRef,
    responseErrorMessageRef,
    onStreamEvent,
  }: {
    eventBlock: string;
    contentParts: string[];
    reasoningParts: string[];
    firstTokenAtRef: { get: () => number | null; set: (value: number) => void };
    completionTokensRef: {
      get: () => number | null;
      set: (value: number | null) => void;
    };
    responseErrorMessageRef: {
      get: () => string | null;
      set: (value: string | null) => void;
    };
    onStreamEvent: () => void;
  }): void {
    for (const line of eventBlock.split("\n")) {
      if (!line.startsWith("data:")) {
        continue;
      }

      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") {
        continue;
      }

      onStreamEvent();

      let chunk: ParsedStreamChunk;
      try {
        chunk = JSON.parse(payload) as ParsedStreamChunk;
      } catch {
        continue;
      }

      if (
        typeof chunk.usage?.completion_tokens === "number" &&
        Number.isFinite(chunk.usage.completion_tokens)
      ) {
        completionTokensRef.set(chunk.usage.completion_tokens);
      }

      if (chunk.error?.message && !responseErrorMessageRef.get()) {
        responseErrorMessageRef.set(chunk.error.message);
      }

      const delta = chunk.choices?.[0]?.delta;
      const content = this.normalizeDeltaContent(delta?.content);
      const reasoning =
        delta?.reasoning_content ??
        delta?.provider_specific_fields?.reasoning_content;

      const observedToken = content?.trim() || reasoning?.trim();
      if (observedToken && firstTokenAtRef.get() === null) {
        firstTokenAtRef.set(Date.now());
      }

      if (content) {
        contentParts.push(content);
      }
      if (reasoning) {
        reasoningParts.push(reasoning);
      }
    }
  }

  private readNonStreamResponse(
    response: Response,
    rawBody: string,
  ): StreamReadResult {
    if (!rawBody.trim()) {
      return {
        responseText: null,
        ttftMs: null,
        completionTokens: null,
        responseErrorMessage: null,
        responsePayload: this.buildResponsePayload(response, rawBody),
      };
    }

    try {
      const json = JSON.parse(rawBody) as ParsedChatResponse;
      return {
        responseText: this.extractResponseText(json),
        ttftMs: null,
        completionTokens:
          typeof json.usage?.completion_tokens === "number"
            ? json.usage.completion_tokens
            : null,
        responseErrorMessage: json.error?.message ?? null,
        responsePayload: this.buildResponsePayload(response, rawBody),
      };
    } catch {
      return {
        responseText: rawBody.slice(0, MAX_CAPTURED_RESPONSE_CHARS),
        ttftMs: null,
        completionTokens: null,
        responseErrorMessage: null,
        responsePayload: this.buildResponsePayload(response, rawBody),
      };
    }
  }

  private buildResponsePayload(response: Response, rawBody: string): string {
    const responseHeaders = Object.fromEntries(response.headers.entries());
    return JSON.stringify({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: rawBody,
    });
  }

  private calculateTokensPerSecond(
    completionTokens: number | null,
    responseTimeMs: number,
    ttftMs: number | null,
  ): number | null {
    if (!completionTokens || completionTokens <= 0) {
      return null;
    }

    const generationMs =
      ttftMs !== null ? responseTimeMs - ttftMs : responseTimeMs;
    const safeGenerationMs =
      generationMs > 0 ? generationMs : responseTimeMs > 0 ? responseTimeMs : 0;

    if (safeGenerationMs <= 0) {
      return null;
    }

    const tokensPerSecond = completionTokens / (safeGenerationMs / 1000);
    return Number(tokensPerSecond.toFixed(2));
  }

  private extractResponseText(json: ParsedChatResponse): string | null {
    const choice = json.choices?.[0];
    const message = choice?.message;
    const content = this.normalizeContentText(message?.content);

    if (content) {
      return content.slice(0, MAX_CAPTURED_RESPONSE_CHARS);
    }

    const reasoning =
      message?.reasoning_content ??
      message?.provider_specific_fields?.reasoning_content ??
      choice?.provider_specific_fields?.reasoning_content;

    if (reasoning?.trim()) {
      return reasoning.trim().slice(0, MAX_CAPTURED_RESPONSE_CHARS);
    }

    if (json.error?.message?.trim()) {
      return json.error.message.trim().slice(0, MAX_CAPTURED_RESPONSE_CHARS);
    }

    return null;
  }

  private normalizeContentText(content: unknown): string | null {
    if (typeof content === "string") {
      const trimmed = content.trim();
      return trimmed || null;
    }

    if (Array.isArray(content)) {
      const textParts = content
        .map((part) => {
          if (typeof part === "string") {
            return part;
          }
          if (!part || typeof part !== "object") {
            return "";
          }

          const candidate = (part as { text?: unknown }).text;
          return typeof candidate === "string" ? candidate : "";
        })
        .map((part) => part.trim())
        .filter(Boolean);

      if (textParts.length > 0) {
        return textParts.join("\n");
      }
    }

    return null;
  }

  private normalizeDeltaContent(content: unknown): string | null {
    if (typeof content === "string") {
      return content.length > 0 ? content : null;
    }

    if (Array.isArray(content)) {
      const textParts = content
        .map((part) => {
          if (typeof part === "string") {
            return part;
          }
          if (!part || typeof part !== "object") {
            return "";
          }

          const candidate = (part as { text?: unknown }).text;
          return typeof candidate === "string" ? candidate : "";
        })
        .filter((part) => part.length > 0);

      if (textParts.length > 0) {
        return textParts.join("");
      }
    }

    return null;
  }

  private async tick(): Promise<void> {
    try {
      const models = await this.getConfiguredModels();
      if (models.length === 0) {
        return;
      }
      await this.probeAndEmit(models, "scheduled");
      cleanupOldHealthChecks(7);
    } catch (err) {
      console.error("[HealthCheckService] Tick failed:", err);
    }
  }

  async runAllChecks(modelNames?: string[]): Promise<void> {
    if (modelNames?.length) {
      await this.probeAndEmit(modelNames, "manual");
    } else {
      const models = await this.getConfiguredModels();
      if (models.length === 0) {
        return;
      }
      await this.probeAndEmit(models, "manual");
    }
    cleanupOldHealthChecks(7);
  }

  private async getConfiguredModels(): Promise<string[]> {
    const { analyticsDataSource } = this.options;
    const models = await analyticsDataSource
      .getModels()
      .catch(() => [] as { modelName: string }[]);
    return models.map((m) => m.modelName).filter(Boolean);
  }

  private async probeAndEmit(
    modelNames: string[],
    source: "scheduled" | "manual",
  ): Promise<void> {
    const { maxConcurrency } = this.options;
    const results: HealthCheckResult[] = [];

    for (let i = 0; i < modelNames.length; i += maxConcurrency) {
      const batch = modelNames.slice(i, i + maxConcurrency);
      const batchResults = await Promise.all(
        batch.map((name) => this.runCheck(name, source)),
      );
      results.push(...batchResults);
    }

    this.emitter.emit("health_check_update", {
      results,
      timestamp: Date.now(),
    });
  }
}
