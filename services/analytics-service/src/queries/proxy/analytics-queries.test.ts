import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRawUnsafe = vi.fn();

vi.mock("./client", () => ({
  getModelProxyPrisma: () => ({
    $queryRawUnsafe: queryRawUnsafe,
  }),
}));

import {
  getCostEfficiency,
  getMetricsSummary,
  getPerformanceMetrics,
} from "./analytics-queries";

describe("proxy analytics-queries", () => {
  beforeEach(() => {
    queryRawUnsafe.mockReset();
  });

  it("aggregates metrics summary from total_cost and token columns", async () => {
    queryRawUnsafe
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

    expect(queryRawUnsafe).toHaveBeenCalledTimes(2);
    expect(queryRawUnsafe.mock.calls[0][0]).toContain('SUM("total_cost")');
    expect(queryRawUnsafe.mock.calls[0][0]).toContain('SUM("input_tokens")');
    expect(queryRawUnsafe.mock.calls[0][0]).toContain('SUM("cached_tokens")');
    expect(queryRawUnsafe.mock.calls[1][0]).toContain(
      `"status" IN ('failed', 'timeout')`,
    );
  });

  it("computes performance metrics from latency_ms and output_tokens", async () => {
    queryRawUnsafe.mockResolvedValueOnce([
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
    expect(queryRawUnsafe.mock.calls[0][0]).toContain('"latency_ms"');
    expect(queryRawUnsafe.mock.calls[0][0]).toContain('"output_tokens"');
  });

  it("ranks cost efficiency by total_cost per model", async () => {
    queryRawUnsafe.mockResolvedValueOnce([
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
    expect(queryRawUnsafe.mock.calls[0][0]).toContain('SUM("total_cost")');
    expect(queryRawUnsafe.mock.calls[0][0]).toContain(
      'ORDER BY SUM("total_cost") DESC',
    );
  });
});
