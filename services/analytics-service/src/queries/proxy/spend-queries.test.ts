import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.fn();

vi.mock("@lite-llm/database/client", () => ({
  queryRaw,
}));

import {
  getSpendLogDetail,
  getSpendLogs,
  getSpendLogsCount,
} from "./spend-queries";

describe("proxy spend-queries", () => {
  beforeEach(() => {
    queryRaw.mockReset();
  });

  it("queries spend logs with filters and pagination", async () => {
    queryRaw.mockResolvedValueOnce([]);

    await getSpendLogs({
      model: "gpt-4o",
      startDate: "2026-06-01",
      endDate: "2026-06-16",
      limit: 25,
      offset: 50,
    });

    expect(queryRaw).toHaveBeenCalled();
    const sql = String(queryRaw.mock.calls[0][0]);
    expect(sql).toContain("model_proxy_requests");
    expect(sql).toContain(`"model" = 'gpt-4o'`);
    expect(sql).toContain("LIMIT 25");
    expect(sql).toContain("OFFSET 50");
  });

  it("counts spend logs with the same filters", async () => {
    queryRaw.mockResolvedValueOnce([{ count: 42 }]);

    const total = await getSpendLogsCount({
      model: "gpt-4o",
      startDate: "2026-06-01",
      endDate: "2026-06-16",
    });

    expect(total).toBe(42);
    const sql = String(queryRaw.mock.calls[0][0]);
    expect(sql).toContain("COUNT(*)");
    expect(sql).toContain(`"model" = 'gpt-4o'`);
  });

  it("loads spend log detail by id with messages", async () => {
    queryRaw
      .mockResolvedValueOnce([{ id: "req-1" }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const row = await getSpendLogDetail("req-1");

    expect(row).toMatchObject({ id: "req-1" });
    const sql = String(queryRaw.mock.calls[0][0]);
    expect(sql).toContain(`"id" = 'req-1'`);
  });
});
