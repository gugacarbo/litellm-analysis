import type { AnalyticsDataSource } from "@lite-llm/analytics-service/data-source";
import type {
  ErrorLogEntry,
  ModelHealth,
} from "@lite-llm/analytics-service/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MonitorService } from "../monitor-service";
import type { MonitorServiceOptions } from "../monitor-types";

function createProxyLikeDataSource(): AnalyticsDataSource {
  return {
    getErrorsSince: vi.fn().mockResolvedValue([
      {
        id: "err-1",
        error_type: "timeout",
        model: "gpt-4o",
        user: null,
        error_message: "upstream timeout",
        timestamp: new Date().toISOString(),
        status_code: 504,
        upstream_model_name: "gpt-4o",
        request_kwargs: null,
        api_key: null,
        spend_status: "failed",
        total_tokens: 0,
        prompt_tokens: 0,
        completion_tokens: 0,
        spend: 0,
        end_time: new Date().toISOString(),
      } satisfies ErrorLogEntry,
    ]),
    getErrorCountByModelSince: vi
      .fn()
      .mockResolvedValue([{ model: "gpt-4o", error_count: 1 }]),
    getNonSuccessCountByModelSince: vi
      .fn()
      .mockResolvedValue([{ model: "gpt-4o", non_success_count: 2 }]),
    getStuckRequests: vi.fn().mockResolvedValue([
      {
        request_id: "stuck-1",
        model: "gpt-4o",
        startTime: new Date().toISOString(),
      },
    ]),
    getModelHealthSince: vi.fn().mockResolvedValue({
      total_requests: 10,
      success_count: 8,
      error_count: 2,
      avg_latency_ms: 450,
      last_success_at: new Date().toISOString(),
      last_error_at: new Date().toISOString(),
      p95_latency_ms: 900,
    } satisfies ModelHealth),
  } as unknown as AnalyticsDataSource;
}

function createMonitorDbMock() {
  const run = vi.fn();
  const values = vi.fn(() => ({ run }));
  const insert = vi.fn(() => ({ values }));

  return {
    monitorDb: { insert } as unknown as MonitorServiceOptions["monitorDb"],
    run,
    values,
    insert,
  };
}

describe("MonitorService with proxy analytics data source", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-16T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("calls proxy monitor methods and emits health_update", async () => {
    const analyticsDataSource = createProxyLikeDataSource();
    const db = createMonitorDbMock();

    const service = new MonitorService({
      pollIntervalMs: 60_000,
      analyticsDataSource,
      monitorDb: db.monitorDb,
    });

    const healthUpdates: Array<{ models: { model: string }[] }> = [];
    service.on("health_update", (data) => {
      healthUpdates.push(data);
    });

    await new Promise<void>((resolve) => {
      service.on("health_update", () => resolve());
      service.start();
      service.stop();
    });

    expect(analyticsDataSource.getErrorsSince).toHaveBeenCalledOnce();
    expect(
      analyticsDataSource.getErrorCountByModelSince,
    ).toHaveBeenCalledOnce();
    expect(
      analyticsDataSource.getNonSuccessCountByModelSince,
    ).toHaveBeenCalledOnce();
    expect(analyticsDataSource.getStuckRequests).toHaveBeenCalledOnce();
    expect(analyticsDataSource.getModelHealthSince).toHaveBeenCalledWith(
      "gpt-4o",
      expect.any(Date),
      24,
    );

    expect(healthUpdates).toHaveLength(1);
    expect(healthUpdates[0]?.models.map((entry) => entry.model)).toContain(
      "gpt-4o",
    );
    expect(service.isDataSourceAvailable()).toBe(true);
  });

  it("marks data source unavailable when proxy monitor methods fail", async () => {
    const analyticsDataSource = createProxyLikeDataSource();
    vi.mocked(analyticsDataSource.getErrorsSince).mockRejectedValue(
      new Error("proxy db unavailable"),
    );
    const db = createMonitorDbMock();

    const service = new MonitorService({
      pollIntervalMs: 60_000,
      analyticsDataSource,
      monitorDb: db.monitorDb,
    });

    await new Promise<void>((resolve) => {
      service.on("health_update", () => resolve());
      service.start();
      service.stop();
    });

    expect(service.isDataSourceAvailable()).toBe(false);
  });
});
