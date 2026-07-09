import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryRaw } = vi.hoisted(() => ({
  queryRaw: vi.fn(),
}));

vi.mock("@lite-llm/database/client", () => ({
  queryRaw,
}));

import { getErrorLogs } from "./error-queries";

describe("proxy error-queries", () => {
  beforeEach(() => {
    queryRaw.mockReset();
  });

  it("queries failed and timeout requests without ErrorLogs join", async () => {
    queryRaw.mockResolvedValue([]);

    await getErrorLogs(25, 7);

    expect(queryRaw).toHaveBeenCalledOnce();
  });
});
