import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { cleanupOldHealthChecks, insertHealthCheck } from "./db";
import type {
  HealthCheckRequestResult,
  HealthCheckResult,
  HealthCheckServiceEvents,
  HealthCheckServiceOptions,
} from "./types";
import { COOLDOWN_MS } from "./types";

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

interface ParsedResponsesStreamChunk {
  type?: string;
  delta?: string;
  error?: { message?: string };
  response?: {
    error?: { message?: string };
    usage?: {
      output_tokens?: number;
      completion_tokens?: number;
    };
    output?: Array<{
      type?: string;
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };
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
  private running = false;
  private inFlightModels = new Set<string>();
  private cooldownMap = new Map<string, number>();
  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: HealthCheckServiceOptions) {
    this.options = options;
  }

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.cooldownTimer = setInterval(() => {
      const now = Date.now();
      for (const [model, expiry] of this.cooldownMap) {
        if (expiry <= now) {
          this.cooldownMap.delete(model);
        }
      }
    }, 1_000);
  }

  stop(): void {
    this.running = false;
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
    this.cooldownMap.clear();
    this.inFlightModels.clear();
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
    const { modelProxyBaseUrl, modelProxyApiKey, prompt, timeoutMs } =
      this.options;
    const startTime = Date.now();
    const executionId = randomUUID();
    const normalizedApiKey = modelProxyApiKey.trim().replace(/^Bearer\s+/i, "");
    const normalizedApiUrl = modelProxyBaseUrl.replace(/\/+$/, "");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (normalizedApiKey) {
      headers.Authorization = `Bearer ${normalizedApiKey}`;
    }

    this.emitter.emit("health_check_stream_started", {
      executionId,
      modelName,
      prompt,
      timestamp: Date.now(),
    });

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
      const streamResult = await this.readStreamResponse(response, startTime, {
        onDelta: (delta) => {
          this.emitter.emit("health_check_stream_delta", {
            executionId,
            modelName,
            delta,
            timestamp: Date.now(),
          });
        },
      });
      const responseTimeMs = Date.now() - startTime;
      const tokensPerSecond = this.calculateTokensPerSecond(
        streamResult.completionTokens,
        responseTimeMs,
        streamResult.ttftMs,
      );

      const upstreamReportedError =
        !!streamResult.responseErrorMessage ||
        (!streamResult.responseText && !streamResult.completionTokens);

      const status: HealthCheckResult["status"] = !response.ok
        ? "unhealthy"
        : upstreamReportedError
          ? "unhealthy"
          : "healthy";

      const errorMessage = !response.ok
        ? (streamResult.responseErrorMessage ??
          `HTTP ${statusCode}: ${response.statusText}`)
        : (streamResult.responseErrorMessage ?? null);

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
        checkedAt: new Date(startTime),
      });

      this.emitter.emit(
        check.status === "error"
          ? "health_check_stream_failed"
          : "health_check_stream_completed",
        {
          executionId,
          modelName,
          result: check,
          timestamp: Date.now(),
        },
      );

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
        checkedAt: new Date(startTime),
      });

      this.emitter.emit("health_check_stream_failed", {
        executionId,
        modelName,
        result: check,
        timestamp: Date.now(),
      });

      return check;
    }
  }

  private isCheckAllowed(
    modelName: string,
    options?: { bypassCooldown?: boolean },
  ): {
    allowed: boolean;
    reason?: string;
  } {
    if (this.inFlightModels.has(modelName)) {
      return { allowed: false, reason: "already in progress" };
    }
    if (!options?.bypassCooldown) {
      const cooldownExpiry = this.cooldownMap.get(modelName);
      if (cooldownExpiry !== undefined && cooldownExpiry > Date.now()) {
        return { allowed: false, reason: "cooldown active" };
      }
    }
    return { allowed: true };
  }

  async requestCheck(modelName: string): Promise<HealthCheckRequestResult> {
    const check = this.isCheckAllowed(modelName);
    if (!check.allowed) {
      this.emitter.emit("health_check_rejected", {
        modelName,
        reason: check.reason ?? "unknown",
        timestamp: Date.now(),
      });
      return { accepted: false, reason: check.reason };
    }

    this.inFlightModels.add(modelName);
    try {
      const result = await this.runCheck(modelName, "manual");
      this.cooldownMap.set(modelName, Date.now() + COOLDOWN_MS);
      this.emitter.emit("health_check_update", {
        results: [result],
        timestamp: Date.now(),
      });
      return { accepted: true };
    } finally {
      this.inFlightModels.delete(modelName);
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
    const mode = this.options.requestModeByModelName?.[modelName] ?? "chat";
    const url =
      mode === "responses"
        ? `${normalizedApiUrl}/responses`
        : `${normalizedApiUrl}/chat/completions`;
    const attempts: Array<Record<string, unknown>> = [];

    const requestBody =
      mode === "responses"
        ? this.buildResponsesHealthCheckRequestBody({ modelName, prompt })
        : this.buildHealthCheckRequestBody({
            modelName,
            prompt,
            includeReasoningEffort: true,
          });
    attempts.push(this.buildRequestAttemptSnapshot(url, headers, requestBody));

    const firstResponse = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (mode === "responses") {
      return {
        response: firstResponse,
        requestPayload: JSON.stringify({ attempts }),
      };
    }

    if (!(await this.shouldRetryWithoutReasoningEffort(firstResponse))) {
      return {
        response: firstResponse,
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

  private redactHeaders(
    headers: Record<string, string>,
  ): Record<string, string> {
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

  private buildResponsesHealthCheckRequestBody({
    modelName,
    prompt,
  }: {
    modelName: string;
    prompt: string;
  }): Record<string, unknown> {
    return {
      model: modelName,
      input: [{ type: "message", role: "user", content: prompt }],
      max_output_tokens: HEALTH_CHECK_MAX_TOKENS,
      stream: true,
      store: false,
      include: ["reasoning.encrypted_content"],
    };
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
    streamOptions?: { onDelta?: (delta: string) => void },
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
          onDelta: streamOptions?.onDelta,
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
      responseText:
        (content || reasoning || responseErrorMessage)?.slice(
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
    onDelta,
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
    onDelta?: (text: string) => void;
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

      let chunk: ParsedStreamChunk | ParsedResponsesStreamChunk;
      try {
        chunk = JSON.parse(payload) as
          | ParsedStreamChunk
          | ParsedResponsesStreamChunk;
      } catch {
        continue;
      }

      if ("type" in chunk && typeof chunk.type === "string") {
        this.consumeResponsesEventChunk({
          chunk,
          contentParts,
          firstTokenAtRef,
          completionTokensRef,
          responseErrorMessageRef,
          onDelta,
        });
        continue;
      }

      const chatChunk = chunk as ParsedStreamChunk;

      if (
        typeof chatChunk.usage?.completion_tokens === "number" &&
        Number.isFinite(chatChunk.usage.completion_tokens)
      ) {
        completionTokensRef.set(chatChunk.usage.completion_tokens);
      }

      if (chatChunk.error?.message && !responseErrorMessageRef.get()) {
        responseErrorMessageRef.set(chatChunk.error.message);
      }

      const delta = chatChunk.choices?.[0]?.delta;
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
        onDelta?.(content);
      }
      if (reasoning) {
        reasoningParts.push(reasoning);
        onDelta?.(reasoning);
      }
    }
  }

  private consumeResponsesEventChunk({
    chunk,
    contentParts,
    firstTokenAtRef,
    completionTokensRef,
    responseErrorMessageRef,
    onDelta,
  }: {
    chunk: ParsedResponsesStreamChunk;
    contentParts: string[];
    firstTokenAtRef: { get: () => number | null; set: (value: number) => void };
    completionTokensRef: {
      get: () => number | null;
      set: (value: number | null) => void;
    };
    responseErrorMessageRef: {
      get: () => string | null;
      set: (value: string | null) => void;
    };
    onDelta?: (text: string) => void;
  }): void {
    const eventType = chunk.type ?? "";
    const usage = chunk.response?.usage;
    const outputTokens =
      typeof usage?.output_tokens === "number"
        ? usage.output_tokens
        : typeof usage?.completion_tokens === "number"
          ? usage.completion_tokens
          : null;

    if (outputTokens !== null && Number.isFinite(outputTokens)) {
      completionTokensRef.set(outputTokens);
    }

    const errorMessage =
      chunk.error?.message ?? chunk.response?.error?.message ?? null;
    if (errorMessage && !responseErrorMessageRef.get()) {
      responseErrorMessageRef.set(errorMessage);
    }

    if (eventType === "response.output_text.delta" && chunk.delta?.trim()) {
      if (firstTokenAtRef.get() === null) {
        firstTokenAtRef.set(Date.now());
      }
      contentParts.push(chunk.delta);
      onDelta?.(chunk.delta);
      return;
    }

    if (eventType === "response.completed") {
      const completedText = this.extractResponsesOutputText(chunk.response);
      if (completedText && contentParts.length === 0) {
        if (firstTokenAtRef.get() === null) {
          firstTokenAtRef.set(Date.now());
        }
        contentParts.push(completedText);
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
      if ("output" in (json as Record<string, unknown>)) {
        return {
          responseText: this.extractResponsesOutputText(
            json as ParsedResponsesStreamChunk["response"],
          ),
          ttftMs: null,
          completionTokens: null,
          responseErrorMessage: null,
          responsePayload: this.buildResponsePayload(response, rawBody),
        };
      }
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

  private extractResponsesOutputText(
    response: ParsedResponsesStreamChunk["response"] | undefined,
  ): string | null {
    if (!response?.output?.length) {
      return null;
    }

    const text = response.output
      .flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text" && item.text?.trim())
      .map((item) => item.text?.trim() ?? "")
      .join("");

    return text ? text.slice(0, MAX_CAPTURED_RESPONSE_CHARS) : null;
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
    const { analyticsDataSource, enabledModelNames } = this.options;
    const models = await analyticsDataSource
      .getModels()
      .catch(() => [] as { modelName: string }[]);
    const names = models.map((m) => m.modelName).filter(Boolean);

    if (enabledModelNames?.length) {
      const enabledSet = new Set(enabledModelNames);
      return names.filter((n) => enabledSet.has(n));
    }

    return names;
  }

  private async probeAndEmit(
    modelNames: string[],
    source: "scheduled" | "manual",
  ): Promise<void> {
    const { maxConcurrency } = this.options;
    const results: HealthCheckResult[] = [];

    for (let i = 0; i < modelNames.length; i += maxConcurrency) {
      const eligible = modelNames.slice(i, i + maxConcurrency).filter(
        (name) =>
          this.isCheckAllowed(name, {
            bypassCooldown: source === "manual",
          }).allowed,
      );
      const batchResults = await Promise.all(
        eligible.map(async (name) => {
          this.inFlightModels.add(name);
          try {
            return await this.runCheck(name, source);
          } finally {
            this.inFlightModels.delete(name);
          }
        }),
      );
      results.push(...batchResults);
    }

    this.emitter.emit("health_check_update", {
      results,
      timestamp: Date.now(),
    });
  }
}
