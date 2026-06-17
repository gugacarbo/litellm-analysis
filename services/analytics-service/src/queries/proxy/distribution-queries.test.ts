import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRawUnsafe = vi.fn();

vi.mock("./client", () => ({
  getModelProxyPrisma: () => ({
    $queryRawUnsafe: queryRawUnsafe,
  }),
}));

import {
  getApiKeyStats,
  getModelDistribution,
  getSpendByKey,
  getSpendByModel,
  getSpendByUser,
  getTokenDistribution,
} from "./distribution-queries";

describe("proxy distribution-queries", () => {
  beforeEach(() => {
    queryRawUnsafe.mockReset();
  });

  it("aggregates spend by model from total_cost", async () => {
    queryRawUnsafe.mockResolvedValueOnce([
      { model: "gpt-4o", total_spend: 4.2 },
    ]);

    const result = await getSpendByModel({ days: 30 });

    expect(result).toEqual([{ model: "gpt-4o", total_spend: 4.2 }]);
    expect(queryRawUnsafe.mock.calls[0][0]).toContain('SUM("total_cost")');
  });

  it("aggregates token distribution from input/output tokens", async () => {
    queryRawUnsafe.mockResolvedValueOnce([
      {
        model: "gpt-4o",
        prompt_tokens: 200,
        completion_tokens: 100,
        avg_tokens_per_request: 150,
        input_output_ratio: 2,
      },
    ]);

    const result = await getTokenDistribution({ days: 30 });

    expect(result[0]?.prompt_tokens).toBe(200);
    expect(queryRawUnsafe.mock.calls[0][0]).toContain('SUM("input_tokens")');
  });

  it("computes model distribution percentages", async () => {
    queryRawUnsafe
      .mockResolvedValueOnce([{ count: 10 }])
      .mockResolvedValueOnce([
        { model: "gpt-4o", request_count: 7, percentage: 70 },
      ]);

    const result = await getModelDistribution({ days: 30 });

    expect(result).toEqual([
      { model: "gpt-4o", request_count: 7, percentage: 70 },
    ]);
    expect(queryRawUnsafe).toHaveBeenCalledTimes(2);
  });

  it("returns empty arrays for user and api key aggregations", async () => {
    await expect(getSpendByUser()).resolves.toEqual([]);
    await expect(getSpendByKey()).resolves.toEqual([]);
    await expect(getApiKeyStats()).resolves.toEqual([]);
    expect(queryRawUnsafe).not.toHaveBeenCalled();
  });
});
