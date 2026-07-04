import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.fn();
const dbExecute = vi.fn();
const dbDeleteWhere = vi.fn();
const dbUpdateSetWhere = vi.fn();

vi.mock("@lite-llm/database/client", () => ({
  queryRaw,
  db: {
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: dbUpdateSetWhere }) }),
    delete: vi.fn().mockReturnValue({ where: dbDeleteWhere }),
    execute: dbExecute,
  },
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
    queryRaw.mockReset();
    dbExecute.mockReset();
    dbDeleteWhere.mockReset();
    dbUpdateSetWhere.mockReset();
  });

  it("queries model statistics from model_proxy_requests", async () => {
    queryRaw.mockResolvedValue([]);

    await getModelStatistics({ days: 7 });

    expect(queryRaw).toHaveBeenCalledOnce();
    const sql = String(queryRaw.mock.calls[0][0]);
    expect(sql).toContain("model_proxy_requests");
    expect(sql).toContain('"unique_users"');
    expect(sql).toContain("COUNT(DISTINCT NULLIF(BTRIM(\"end_user\"), ''))");
    expect(sql).toContain(
      "COUNT(DISTINCT NULLIF(BTRIM(\"api_key_alias\"), ''))",
    );
    expect(sql).toContain('"latency_ms" >= 100');
  });

  it("queries daily spend trend for a model", async () => {
    queryRaw.mockResolvedValue([]);

    await getDailySpendTrendByModel("gpt-4o", 30);

    const sql = String(queryRaw.mock.calls[0][0]);
    expect(sql).toContain(`"model" = 'gpt-4o'`);
    expect(sql).toContain('SUM("total_cost")');
  });

  it("groups error breakdown by error_type", async () => {
    queryRaw.mockResolvedValue([]);

    await getErrorBreakdownByModel("gpt-4o", 30);

    const sql = String(queryRaw.mock.calls[0][0]);
    expect(sql).toContain('"error_type"');
    expect(sql).toContain(`"status" != 'success'`);
  });

  it("computes cache hit rate from cached_tokens and input_tokens", async () => {
    queryRaw.mockResolvedValue([
      { cache_hits: 100, total_requests: 1000, cache_hit_rate: 10 },
    ]);

    const result = await getModelCacheHitRateByModel("gpt-4o", 30);

    const sql = String(queryRaw.mock.calls[0][0]);
    expect(sql).toContain('SUM("cached_tokens")');
    expect(sql).toContain('SUM("input_tokens")');
    expect(result.cache_hit_rate).toBe(10);
  });

  it("reads TTFT percentiles from ttft_ms column", async () => {
    queryRaw.mockResolvedValue([
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

    const sql = String(queryRaw.mock.calls[0][0]);
    expect(sql).toContain('"ttft_ms"');
    expect(result.p50_ttft_ms).toBe(100);
  });

  it("merges models via db.update", async () => {
    dbUpdateSetWhere.mockResolvedValue(undefined);

    await mergeModels("old-model", "new-model");

    expect(dbUpdateSetWhere).toHaveBeenCalled();
  });

  it("deletes model logs by model name via db.delete", async () => {
    dbDeleteWhere.mockResolvedValue(undefined);

    await deleteModelLogs("gpt-4o");

    expect(dbDeleteWhere).toHaveBeenCalled();
  });

  it("deletes blank model logs with raw SQL via db.execute", async () => {
    dbExecute.mockResolvedValue(undefined);

    await deleteModelLogs("   ");

    expect(dbExecute).toHaveBeenCalledOnce();
    expect(dbDeleteWhere).not.toHaveBeenCalled();
  });
});
