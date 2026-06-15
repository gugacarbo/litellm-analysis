import type { SpendLogEntry } from "@lite-llm/analytics-service";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildSpendLogFingerprintMap,
  createSpendLogsWatcher,
  diffSpendLogFingerprints,
} from "../ws/spend-logs-watcher";

function createLog(
  overrides: Partial<SpendLogEntry> & Pick<SpendLogEntry, "request_id">,
): SpendLogEntry {
  return {
    model: "gpt-4",
    user: null,
    total_tokens: 100,
    prompt_tokens: 50,
    completion_tokens: 50,
    spend: 0.01,
    time_to_first_token_ms: null,
    start_time: "2026-06-15T10:00:00.000Z",
    end_time: "2026-06-15T10:00:01.000Z",
    api_key: null,
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
      createLog({ request_id: "req-1" }),
      createLog({ request_id: "req-2", status: "failure" }),
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

  it("emits spend_logs_changed when a new request_id appears", async () => {
    const baseline = [createLog({ request_id: "req-1" })];
    const withNewLog = [
      createLog({ request_id: "req-1" }),
      createLog({ request_id: "req-2", status: "success" }),
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

  it("detects status and end_time fingerprint changes", () => {
    const previous = buildSpendLogFingerprintMap([
      createLog({
        request_id: "req-1",
        status: "success",
        end_time: "2026-06-15T10:00:01.000Z",
      }),
    ]);
    const current = buildSpendLogFingerprintMap([
      createLog({
        request_id: "req-1",
        status: "failure",
        end_time: "2026-06-15T10:00:02.000Z",
      }),
    ]);

    expect(diffSpendLogFingerprints(previous, current)).toEqual(
      new Set(["req-1"]),
    );
  });
});
