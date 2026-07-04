import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.fn();

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
    const sql = String(queryRaw.mock.calls[0][0]);
    expect(sql).toContain("model_proxy_requests");
    expect(sql).toContain(`"status" IN ('failed', 'timeout')`);
    expect(sql).not.toContain("LiteLLM_ErrorLogs");
    expect(sql).toContain('"error_type"');
    expect(sql).toContain('"upstream_model" as "upstream_model_name"');
    expect(sql).toContain("LIMIT 25");
  });
});
