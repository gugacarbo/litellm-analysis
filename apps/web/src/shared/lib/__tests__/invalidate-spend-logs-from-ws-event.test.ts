import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { invalidateSpendLogsFromWsEvent } from "@/shared/lib/invalidate-spend-logs-from-ws-event";
import { queryKeys } from "@/shared/lib/query-keys";

describe("invalidateSpendLogsFromWsEvent", () => {
  it("invalidates spend log list queries on every event", () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    invalidateSpendLogsFromWsEvent(queryClient, { timestamp: Date.now() });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["spend-logs"],
    });
  });

  it("invalidates detail queries only for intersecting request ids", () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    invalidateSpendLogsFromWsEvent(
      queryClient,
      {
        changedRequestIds: ["req-a", "req-b", "req-c"],
        timestamp: Date.now(),
      },
      { visibleRequestIds: ["req-b", "req-d"] },
    );

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.spendLogDetail("req-b"),
    });
    expect(invalidateQueries).not.toHaveBeenCalledWith({
      queryKey: queryKeys.spendLogDetail("req-a"),
    });
    expect(invalidateQueries).not.toHaveBeenCalledWith({
      queryKey: queryKeys.spendLogDetail("req-c"),
    });
  });

  it("invalidates all changed detail queries when no visible filter is set", () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    invalidateSpendLogsFromWsEvent(queryClient, {
      changedRequestIds: ["req-a", "req-b"],
      timestamp: Date.now(),
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.spendLogDetail("req-a"),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.spendLogDetail("req-b"),
    });
  });
});
