import { describe, expect, it, vi } from "vitest";
import type {
  AnalyticsDataSource,
  SpendLogEntry,
  SpendLogsFilters,
  SpendLogsResponse,
} from "../types/index";
import { compareTotals, HybridDataSource } from "./hybrid";

function createLog(
  overrides: Partial<SpendLogEntry> & Pick<SpendLogEntry, "request_id">,
): SpendLogEntry {
  return {
    request_id: overrides.request_id,
    model: overrides.model ?? "gpt-4o",
    user: null,
    total_tokens: overrides.total_tokens ?? 100,
    prompt_tokens: overrides.prompt_tokens ?? 60,
    completion_tokens: overrides.completion_tokens ?? 40,
    spend: overrides.spend ?? 0.01,
    time_to_first_token_ms: overrides.time_to_first_token_ms ?? 200,
    start_time: overrides.start_time ?? "2026-06-16T10:00:00.000Z",
    end_time: overrides.end_time ?? "2026-06-16T10:00:01.000Z",
    api_key: null,
    status: overrides.status ?? "success",
    request_duration_ms: overrides.request_duration_ms ?? 1000,
    messages: null,
  };
}

function createMockDataSource(
  logs: SpendLogEntry[],
): Pick<AnalyticsDataSource, "getSpendLogs"> {
  return {
    getSpendLogs: async (
      filters: SpendLogsFilters,
    ): Promise<SpendLogsResponse> => {
      const limit = filters.limit ?? 50;
      const offset = filters.offset ?? 0;
      const page = logs.slice(
        offset,
        offset + (limit === 0 ? logs.length : limit),
      );

      return {
        logs: page,
        pagination: {
          total: logs.length,
          page: 1,
          page_size: limit,
          total_pages: 1,
        },
      };
    },
  };
}

describe("compareTotals", () => {
  it("merges by id with proxy winning and checks tolerances", async () => {
    const litellm = createMockDataSource([
      createLog({ request_id: "shared", spend: 0.02, total_tokens: 100 }),
      createLog({ request_id: "litellm-only", spend: 0.01, total_tokens: 50 }),
    ]);
    const proxy = createMockDataSource([
      createLog({ request_id: "shared", spend: 0.03, total_tokens: 110 }),
      createLog({ request_id: "proxy-only", spend: 0.02, total_tokens: 80 }),
    ]);

    const result = await compareTotals(
      {
        startDate: "2026-06-01",
        endDate: "2026-06-16",
      },
      litellm as AnalyticsDataSource,
      proxy as AnalyticsDataSource,
    );

    expect(result.request_count).toMatchObject({
      litellm: 2,
      proxy: 2,
      merged: 3,
    });
    expect(result.total_cost.litellm).toBeCloseTo(0.03);
    expect(result.total_cost.proxy).toBeCloseTo(0.05);
    expect(result.total_tokens.litellm).toBe(150);
    expect(result.total_tokens.proxy).toBe(190);
  });
});

describe("HybridDataSource delegation", () => {
  it("prefers proxy for P2-P5 monitor and dashboard methods", async () => {
    const litellm = {
      getMetricsSummary: vi.fn().mockResolvedValue({ litellm: true }),
      getErrorsSince: vi.fn().mockResolvedValue([]),
    };
    const proxy = {
      getMetricsSummary: vi.fn().mockResolvedValue({ proxy: true }),
      getErrorsSince: vi.fn().mockResolvedValue([{ id: "proxy-error" }]),
      getSpendLogs: vi.fn().mockResolvedValue({
        logs: [],
        pagination: { total: 0, page: 1, page_size: 50, total_pages: 0 },
      }),
    };

    const hybrid = new HybridDataSource(litellm as never, proxy as never);

    await expect(hybrid.getMetricsSummary({ days: 7 })).resolves.toEqual({
      proxy: true,
    });
    await expect(hybrid.getErrorsSince(new Date())).resolves.toEqual([
      { id: "proxy-error" },
    ]);
    expect(proxy.getMetricsSummary).toHaveBeenCalledOnce();
    expect(proxy.getErrorsSince).toHaveBeenCalledOnce();
    expect(litellm.getMetricsSummary).not.toHaveBeenCalled();
    expect(litellm.getErrorsSince).not.toHaveBeenCalled();
  });
});
