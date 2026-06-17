import type { ProxyRequestLog } from "@lite-llm/analytics-service/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildSpendLogFingerprintMap,
  createSpendLogsWatcher,
  diffSpendLogFingerprints,
} from "../ws/spend-logs-watcher";

function createLog(
  overrides: Partial<ProxyRequestLog> & Pick<ProxyRequestLog, "id">,
): ProxyRequestLog {
  return {
    model: "gpt-4",
    upstream_model: "gpt-4",
    upstream_base_url: "https://api.openai.com/v1",
    total_tokens: 100,
    input_tokens: 50,
    output_tokens: 50,
    total_cost: 0.01,
    ttft_ms: null,
    started_at: "2026-06-15T10:00:00.000Z",
    finished_at: "2026-06-15T10:00:01.000Z",
    latency_ms: 1000,
    cached_tokens: null,
    reasoning_tokens: null,
    usage_estimated: false,
    cost_estimated: false,
    input_cost_per_token: null,
    output_cost_per_token: null,
    input_cost: null,
    output_cost: null,
    estimated_cost_usd: null,
    error_type: null,
    error_message: null,
    error_status_code: null,
    error_summary: null,
    request_body: null,
    response_body: null,
    messages: [],
    status: "success",
    ...overrides,
  };
}

describe("spend-logs-watcher", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not emit when consecutive ticks return identical logs", async () => {
    const logs = [
      createLog({ id: "req-1" }),
      createLog({ id: "req-2", status: "failed" }),
    ];
    const getSpendLogs = vi.fn().mockResolvedValue({ logs, pagination: {} });
    const broadcast = vi.fn();

    const watcher = createSpendLogsWatcher({
      analyticsDataSource: { getSpendLogs },
      wsServer: { broadcast },
      debounceMs: 100,
    });

    await watcher.tick();
    await watcher.tick();
    await vi.advanceTimersByTimeAsync(100);

    expect(broadcast).not.toHaveBeenCalled();
  });

  it("emits spend_logs_changed when a new request id appears", async () => {
    const baseline = [createLog({ id: "req-1" })];
    const withNewLog = [
      createLog({ id: "req-1" }),
      createLog({ id: "req-2", status: "success" }),
    ];
    const getSpendLogs = vi
      .fn()
      .mockResolvedValueOnce({ logs: baseline, pagination: {} })
      .mockResolvedValueOnce({ logs: withNewLog, pagination: {} });
    const broadcast = vi.fn();

    const watcher = createSpendLogsWatcher({
      analyticsDataSource: { getSpendLogs },
      wsServer: { broadcast },
      debounceMs: 100,
    });

    await watcher.tick();
    await watcher.tick();
    await vi.advanceTimersByTimeAsync(100);

    expect(broadcast).toHaveBeenCalledOnce();
    expect(broadcast).toHaveBeenCalledWith({
      type: "spend_logs_changed",
      data: {
        changedRequestIds: ["req-2"],
        timestamp: expect.any(Number),
      },
    });
  });

  it("detects status and finished_at fingerprint changes", () => {
    const previous = buildSpendLogFingerprintMap([
      createLog({
        id: "req-1",
        status: "success",
        finished_at: "2026-06-15T10:00:01.000Z",
      }),
    ]);
    const current = buildSpendLogFingerprintMap([
      createLog({
        id: "req-1",
        status: "failed",
        finished_at: "2026-06-15T10:00:02.000Z",
      }),
    ]);

    expect(diffSpendLogFingerprints(previous, current)).toEqual(
      new Set(["req-1"]),
    );
  });
});
