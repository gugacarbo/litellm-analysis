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

    try {
      const response = await fetch(`${litellmApiUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${litellmApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      const responseTimeMs = Date.now() - startTime;
      const statusCode = response.status;
      let responseText = "";

      try {
        const json = (await response.json()) as {
          choices?: { message?: { content?: string } }[];
          error?: { message?: string };
        };
        responseText =
          json.choices?.[0]?.message?.content ??
          JSON.stringify(json).slice(0, 500);
      } catch {
        responseText = await response.text().catch(() => "");
        responseText = responseText.slice(0, 500);
      }

      const status: HealthCheckResult["status"] = response.ok
        ? "healthy"
        : "unhealthy";

      const check: HealthCheckResult = {
        id: 0,
        modelName,
        status,
        responseTimeMs,
        statusCode,
        promptSent: prompt,
        responseReceived: responseText || null,
        errorMessage: response.ok
          ? null
          : `HTTP ${statusCode}: ${response.statusText}`,
        source,
        checkedAt: Math.floor(startTime / 1000),
      };

      insertHealthCheck({
        modelName,
        status: check.status,
        responseTimeMs: check.responseTimeMs,
        statusCode: check.statusCode,
        promptSent: check.promptSent,
        responseReceived: check.responseReceived,
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
        statusCode: null,
        promptSent: prompt,
        responseReceived: null,
        errorMessage,
        source,
        checkedAt: Math.floor(startTime / 1000),
      };

      insertHealthCheck({
        modelName,
        status: check.status,
        responseTimeMs: check.responseTimeMs,
        statusCode: check.statusCode,
        promptSent: check.promptSent,
        responseReceived: check.responseReceived,
        errorMessage: check.errorMessage,
        source: check.source,
        checkedAt: check.checkedAt,
      });

      return check;
    }
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
