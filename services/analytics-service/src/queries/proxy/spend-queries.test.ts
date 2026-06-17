import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
const count = vi.fn();
const findUnique = vi.fn();

vi.mock("./client", () => ({
  getModelProxyPrisma: () => ({
    modelProxyRequest: {
      findMany,
      count,
      findUnique,
    },
  }),
}));

import {
  getSpendLogDetail,
  getSpendLogs,
  getSpendLogsCount,
} from "./spend-queries";

describe("proxy spend-queries", () => {
  beforeEach(() => {
    findMany.mockReset();
    count.mockReset();
    findUnique.mockReset();
  });

  it("queries spend logs with filters and pagination", async () => {
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(0);

    await getSpendLogs({
      model: "gpt-4o",
      startDate: "2026-06-01",
      endDate: "2026-06-16",
      limit: 25,
      offset: 50,
    });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        model: "gpt-4o",
        startedAt: {
          gte: new Date("2026-06-01"),
          lte: new Date("2026-06-16"),
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        usageAdjustments: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { startedAt: "desc" },
      take: 25,
      skip: 50,
    });
  });

  it("counts spend logs with the same filters", async () => {
    count.mockResolvedValue(42);

    const total = await getSpendLogsCount({
      model: "gpt-4o",
      startDate: "2026-06-01",
      endDate: "2026-06-16",
    });

    expect(total).toBe(42);
    expect(count).toHaveBeenCalledWith({
      where: {
        model: "gpt-4o",
        startedAt: {
          gte: new Date("2026-06-01"),
          lte: new Date("2026-06-16"),
        },
      },
    });
  });

  it("loads spend log detail by id with messages", async () => {
    findUnique.mockResolvedValue({ id: "req-1" });

    const row = await getSpendLogDetail("req-1");

    expect(row).toEqual({ id: "req-1" });
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: "req-1" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        usageAdjustments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  });
});
