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

  it("aggregates spend by user from end_user", async () => {
    queryRawUnsafe.mockResolvedValueOnce([
      {
        user: "alice",
        total_spend: 1.5,
        total_tokens: 1000,
        request_count: 3,
      },
    ]);

    const result = await getSpendByUser({ days: 30 });

    expect(result[0]?.user).toBe("alice");
    expect(queryRawUnsafe.mock.calls[0][0]).toContain('"end_user"');
  });

  it("aggregates spend by api key alias", async () => {
    queryRawUnsafe.mockResolvedValueOnce([
      { key: "prod-key", total_spend: 2.1, total_tokens: 500 },
    ]);

    const result = await getSpendByKey(30);

    expect(result[0]?.key).toBe("prod-key");
    expect(queryRawUnsafe.mock.calls[0][0]).toContain('"api_key_alias"');
  });

  it("aggregates api key stats from ledger", async () => {
    queryRawUnsafe.mockResolvedValueOnce([
      {
        key: "prod-key",
        request_count: 4,
        total_spend: 2.1,
        total_tokens: 500,
        avg_tokens_per_request: 125,
        success_rate: 100,
        avg_tokens_per_second: 50,
        last_used: new Date("2026-06-16T00:00:00.000Z"),
      },
    ]);

    const result = await getApiKeyStats({ days: 30 });

    expect(result[0]?.key).toBe("prod-key");
    expect(queryRawUnsafe.mock.calls[0][0]).toContain('"api_key_alias"');
  });
});
