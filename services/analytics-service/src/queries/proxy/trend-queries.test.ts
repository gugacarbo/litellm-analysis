import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryRaw } = vi.hoisted(() => ({
  queryRaw: vi.fn(),
}));

vi.mock("@lite-llm/database/client", () => ({
  queryRaw,
}));

vi.mock("./time-buckets", () => ({
  resolveProxyTimeBucket: vi.fn().mockResolvedValue({
    sqlBucket: `DATE("started_at")`,
    sqlLabel: `CAST(DATE("started_at") AS TEXT)`,
    granularity: "1d",
  }),
}));

import {
  getDailySpendTrend,
  getDailyTokenTrend,
  getHourlySpendTrend,
  getHourlyUsagePatterns,
} from "./trend-queries";

describe("proxy trend-queries", () => {
  beforeEach(() => {
    queryRaw.mockReset();
  });

  it("aggregates daily spend trend from total_cost", async () => {
    queryRaw.mockResolvedValueOnce([
      { date: "2026-06-01", spend: 1.5, granularity: "1d" },
    ]);

    const result = await getDailySpendTrend({ days: 7 });

    expect(result).toEqual([
      { date: "2026-06-01", spend: 1.5, granularity: "1d" },
    ]);
  });

  it("aggregates daily token trend from input/output tokens", async () => {
    queryRaw.mockResolvedValueOnce([
      {
        date: "2026-06-01",
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
        request_count: 2,
        granularity: "1d",
      },
    ]);

    const result = await getDailyTokenTrend({ days: 7 });

    expect(result[0]?.prompt_tokens).toBe(100);
  });

  it("aggregates hourly spend trend", async () => {
    queryRaw.mockResolvedValueOnce([
      {
        timestamp: "2026-06-16 10:00",
        hour: 10,
        spend: 2,
        total_tokens: 200,
        request_count: 1,
      },
    ]);

    const result = await getHourlySpendTrend(1);

    expect(result[0]?.spend).toBe(2);
  });

  it("aggregates hourly usage patterns by hour of day", async () => {
    queryRaw.mockResolvedValueOnce([
      {
        hour: 14,
        request_count: 5,
        total_spend: 3,
        total_tokens: 500,
      },
    ]);

    const result = await getHourlyUsagePatterns({ days: 30 });

    expect(result[0]?.hour).toBe(14);
  });
});
