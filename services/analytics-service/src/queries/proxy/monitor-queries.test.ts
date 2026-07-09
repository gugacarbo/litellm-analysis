import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryRaw } = vi.hoisted(() => ({
  queryRaw: vi.fn(),
}));

vi.mock("@lite-llm/database/client", () => ({
  queryRaw,
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
    queryRaw.mockReset();
  });

  it("queries errors since timestamp using error columns", async () => {
    queryRaw.mockResolvedValue([]);
    const since = new Date("2026-06-16T10:00:00.000Z");

    await getErrorsSince(since, 50);
  });

  it("counts errors by model since timestamp", async () => {
    queryRaw.mockResolvedValue([]);
    const since = new Date("2026-06-16T10:00:00.000Z");

    await getErrorCountByModelSince(since);
  });

  it("counts non-success statuses including cancelled", async () => {
    queryRaw.mockResolvedValue([]);
    const since = new Date("2026-06-16T10:00:00.000Z");

    await getNonSuccessCountByModelSince(since);
  });

  it("queries model health from latency_ms", async () => {
    queryRaw.mockResolvedValue([]);
    const since = new Date("2026-06-16T09:00:00.000Z");

    await getModelHealthSince({
      model: "gpt-4o",
      since,
      baselineHours: 24,
    });
  });

  it("finds stuck requests with started status before threshold", async () => {
    queryRaw.mockResolvedValue([]);
    const threshold = new Date("2026-06-16T10:00:00.000Z");

    await getStuckRequests(threshold);
  });
});
