import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryRaw } = vi.hoisted(() => ({
  queryRaw: vi.fn(),
}));

vi.mock("@lite-llm/database/client", () => ({
  queryRaw,
}));

import {
  getCostEfficiency,
  getMetricsSummary,
  getPerformanceMetrics,
} from "./analytics-queries";

describe("proxy analytics-queries", () => {
  beforeEach(() => {
    queryRaw.mockReset();
  });

  it("aggregates metrics summary from total_cost and token columns", async () => {
    queryRaw
      .mockResolvedValueOnce([
        {
          totalSpend: 12.5,
          totalTokens: 1000,
          activeModels: 2,
          promptTokens: 600,
          completionTokens: 400,
          cachedTokens: 50,
        },
      ])
      .mockResolvedValueOnce([{ errorCount: 3 }]);

    const result = await getMetricsSummary({ days: 7 });

    expect(result).toEqual({
      totalSpend: 12.5,
      totalTokens: 1000,
      activeModels: 2,
      errorCount: 3,
      promptTokens: 600,
      completionTokens: 400,
      cachedTokens: 50,
    });

    expect(queryRaw).toHaveBeenCalledTimes(2);
  });

  it("computes performance metrics from latency_ms and output_tokens", async () => {
    queryRaw.mockResolvedValueOnce([
      {
        total_requests: 10,
        avg_duration_ms: 250,
        success_rate: 90,
        avg_tokens_per_second: 42,
      },
    ]);

    const result = await getPerformanceMetrics({ days: 30 });

    expect(result).toEqual({
      total_requests: 10,
      avg_duration_ms: 250,
      success_rate: 90,
      avg_tokens_per_second: 42,
    });
  });

  it("ranks cost efficiency by total_cost per model", async () => {
    queryRaw.mockResolvedValueOnce([
      {
        model: "gpt-4o",
        total_spend: 5,
        total_tokens: 1000,
        cost_per_1k_tokens: 5,
        request_count: 2,
      },
    ]);

    const result = await getCostEfficiency({ days: 30 });

    expect(result).toHaveLength(1);
  });
});
