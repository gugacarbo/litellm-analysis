import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRawUnsafe = vi.fn();

vi.mock("./client", () => ({
  getModelProxyPrisma: () => ({
    $queryRawUnsafe: queryRawUnsafe,
  }),
}));

import {
  getErrorCountByModelSince,
  getErrorsSince,
  getModelHealthSince,
  getNonSuccessCountByModelSince,
  getStuckRequests,
} from "./monitor-queries";

describe("proxy monitor-queries", () => {
  beforeEach(() => {
    queryRawUnsafe.mockReset();
  });

  it("queries errors since timestamp using error columns", async () => {
    queryRawUnsafe.mockResolvedValue([]);
    const since = new Date("2026-06-16T10:00:00.000Z");

    await getErrorsSince(since, 50);

    const sql = String(queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain(`"started_at" > '2026-06-16T10:00:00.000Z'`);
    expect(sql).toContain(`"status" IN ('failed', 'timeout')`);
    expect(sql).not.toContain("LiteLLM_ErrorLogs");
  });

  it("counts errors by model since timestamp", async () => {
    queryRawUnsafe.mockResolvedValue([]);
    const since = new Date("2026-06-16T10:00:00.000Z");

    await getErrorCountByModelSince(since);

    const sql = String(queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain('COUNT(*)::float as "error_count"');
    expect(sql).toContain(`"status" IN ('failed', 'timeout')`);
  });

  it("counts non-success statuses including cancelled", async () => {
    queryRawUnsafe.mockResolvedValue([]);
    const since = new Date("2026-06-16T10:00:00.000Z");

    await getNonSuccessCountByModelSince(since);

    const sql = String(queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain(`"status" IN ('failed', 'timeout', 'cancelled')`);
  });

  it("queries model health from latency_ms", async () => {
    queryRawUnsafe.mockResolvedValue([]);
    const since = new Date("2026-06-16T09:00:00.000Z");

    await getModelHealthSince({
      model: "gpt-4o",
      since,
      baselineHours: 24,
    });

    const sql = String(queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain(`"model" = 'gpt-4o'`);
    expect(sql).toContain('AVG("latency_ms")');
    expect(sql).toContain(
      'PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "latency_ms")',
    );
  });

  it("finds stuck requests with started status before threshold", async () => {
    queryRawUnsafe.mockResolvedValue([]);
    const threshold = new Date("2026-06-16T10:00:00.000Z");

    await getStuckRequests(threshold);

    const sql = String(queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain(`"status" = 'started'`);
    expect(sql).toContain(`"started_at" < '2026-06-16T10:00:00.000Z'`);
    expect(sql).toContain('"id" as "request_id"');
  });
});
