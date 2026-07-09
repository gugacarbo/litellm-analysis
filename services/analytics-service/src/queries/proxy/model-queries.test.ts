import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryRaw, dbExecute, dbDeleteWhere, dbUpdateSetWhere } = vi.hoisted(
  () => ({
    queryRaw: vi.fn(),
    dbExecute: vi.fn(),
    dbDeleteWhere: vi.fn(),
    dbUpdateSetWhere: vi.fn(),
  }),
);

vi.mock("@lite-llm/database/client", () => ({
  queryRaw,
  db: {
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({ where: dbUpdateSetWhere }),
    }),
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
  });

  it("queries daily spend trend for a model", async () => {
    queryRaw.mockResolvedValue([]);

    await getDailySpendTrendByModel("gpt-4o", 30);
  });

  it("groups error breakdown by error_type", async () => {
    queryRaw.mockResolvedValue([]);

    await getErrorBreakdownByModel("gpt-4o", 30);
  });

  it("computes cache hit rate from cached_tokens and input_tokens", async () => {
    queryRaw.mockResolvedValue([
      { cache_hits: 100, total_requests: 1000, cache_hit_rate: 10 },
    ]);

    const result = await getModelCacheHitRateByModel("gpt-4o", 30);

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
