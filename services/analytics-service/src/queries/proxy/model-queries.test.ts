import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRawUnsafe = vi.fn();
const executeRawUnsafe = vi.fn();
const updateMany = vi.fn();
const deleteMany = vi.fn();

vi.mock("./client", () => ({
  getModelProxyPrisma: () => ({
    $queryRawUnsafe: queryRawUnsafe,
    $executeRawUnsafe: executeRawUnsafe,
    modelProxyRequest: {
      updateMany,
      deleteMany,
    },
  }),
}));

vi.mock("./time-buckets", () => ({
  resolveProxyTimeBucket: vi.fn().mockResolvedValue({
    sqlBucket: 'DATE("started_at")',
    sqlLabel: 'CAST(DATE("started_at") AS TEXT)',
    granularity: "1d",
  }),
}));

import {
  deleteModelLogs,
  getDailySpendTrendByModel,
  getErrorBreakdownByModel,
  getModelCacheHitRateByModel,
  getModelStatistics,
  getModelTTFTPercentilesByModel,
  mergeModels,
} from "./model-queries";

describe("proxy model-queries", () => {
  beforeEach(() => {
    queryRawUnsafe.mockReset();
    executeRawUnsafe.mockReset();
    updateMany.mockReset();
    deleteMany.mockReset();
  });

  it("queries model statistics from model_proxy_requests", async () => {
    queryRawUnsafe.mockResolvedValue([]);

    await getModelStatistics({ days: 7 });

    expect(queryRawUnsafe).toHaveBeenCalledOnce();
    const sql = String(queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain("model_proxy_requests");
    expect(sql).toContain('"unique_users"');
    expect(sql).toContain("COUNT(DISTINCT NULLIF(BTRIM(\"end_user\"), ''))");
    expect(sql).toContain(
      "COUNT(DISTINCT NULLIF(BTRIM(\"api_key_alias\"), ''))",
    );
    expect(sql).toContain('"latency_ms" >= 100');
  });

  it("queries daily spend trend for a model", async () => {
    queryRawUnsafe.mockResolvedValue([]);

    await getDailySpendTrendByModel("gpt-4o", 30);

    const sql = String(queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain(`"model" = 'gpt-4o'`);
    expect(sql).toContain('SUM("total_cost")');
  });

  it("groups error breakdown by error_type", async () => {
    queryRawUnsafe.mockResolvedValue([]);

    await getErrorBreakdownByModel("gpt-4o", 30);

    const sql = String(queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain('"error_type"');
    expect(sql).toContain(`"status" != 'success'`);
  });

  it("computes cache hit rate from cached_tokens and input_tokens", async () => {
    queryRawUnsafe.mockResolvedValue([
      { cache_hits: 100, total_requests: 1000, cache_hit_rate: 10 },
    ]);

    const result = await getModelCacheHitRateByModel("gpt-4o", 30);

    const sql = String(queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain('SUM("cached_tokens")');
    expect(sql).toContain('SUM("input_tokens")');
    expect(result.cache_hit_rate).toBe(10);
  });

  it("reads TTFT percentiles from ttft_ms column", async () => {
    queryRawUnsafe.mockResolvedValue([
      {
        avg_ttft_ms: 120,
        p50_ttft_ms: 100,
        p95_ttft_ms: 200,
        p99_ttft_ms: 300,
        min_ttft_ms: 50,
        max_ttft_ms: 400,
      },
    ]);

    const result = await getModelTTFTPercentilesByModel("gpt-4o");

    const sql = String(queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain('"ttft_ms"');
    expect(result.p50_ttft_ms).toBe(100);
  });

  it("merges models via updateMany", async () => {
    updateMany.mockResolvedValue({ count: 3 });

    await mergeModels("old-model", "new-model");

    expect(updateMany).toHaveBeenCalledWith({
      where: { model: "old-model" },
      data: { model: "new-model" },
    });
  });

  it("deletes model logs by model name", async () => {
    deleteMany.mockResolvedValue({ count: 5 });

    await deleteModelLogs("gpt-4o");

    expect(deleteMany).toHaveBeenCalledWith({
      where: { model: "gpt-4o" },
    });
  });

  it("deletes blank model logs with raw SQL", async () => {
    executeRawUnsafe.mockResolvedValue(1);

    await deleteModelLogs("   ");

    expect(executeRawUnsafe).toHaveBeenCalledOnce();
    expect(deleteMany).not.toHaveBeenCalled();
  });
});
