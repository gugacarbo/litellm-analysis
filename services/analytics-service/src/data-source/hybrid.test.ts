import { describe, expect, it, vi } from "vitest";
import type { AnalyticsDataSource, SpendTotals } from "../types/index";
import { compareTotals, HybridDataSource } from "./hybrid";

function createTotals(overrides: Partial<SpendTotals> = {}): SpendTotals {
  return {
    request_count: 0,
    total_tokens: 0,
    total_cost: 0,
    error_count: 0,
    avg_latency_ms: 0,
    ...overrides,
  };
}

function createMockDataSource(
  totals: SpendTotals,
): Pick<AnalyticsDataSource, "getSpendTotals"> {
  return {
    getSpendTotals: async () => totals,
  };
}

describe("compareTotals", () => {
  it("uses SQL aggregates without row limits and checks tolerances", async () => {
    const litellm = createMockDataSource(
      createTotals({
        request_count: 2,
        total_tokens: 150,
        total_cost: 0.03,
        error_count: 0,
        avg_latency_ms: 500,
      }),
    );
    const proxy = createMockDataSource(
      createTotals({
        request_count: 2,
        total_tokens: 190,
        total_cost: 0.05,
        error_count: 0,
        avg_latency_ms: 500,
      }),
    );

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
      merged: 2,
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
      getSpendTotals: vi.fn().mockResolvedValue(createTotals()),
      getModels: vi.fn().mockResolvedValue([]),
      getModelDetails: vi.fn().mockResolvedValue([]),
      getCredentials: vi.fn().mockResolvedValue([]),
      getDefaultCredential: vi.fn().mockResolvedValue(null),
      getHealthCheckPrompt: vi.fn().mockResolvedValue(null),
      setDefaultCredential: vi.fn(),
      getAgentRoutingConfig: vi.fn().mockResolvedValue(null),
      updateAgentRoutingConfig: vi.fn(),
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
