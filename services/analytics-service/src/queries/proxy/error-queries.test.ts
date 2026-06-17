import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRawUnsafe = vi.fn();

vi.mock("./client", () => ({
  getModelProxyPrisma: () => ({
    $queryRawUnsafe: queryRawUnsafe,
  }),
}));

import { getErrorLogs } from "./error-queries";

describe("proxy error-queries", () => {
  beforeEach(() => {
    queryRawUnsafe.mockReset();
  });

  it("queries failed and timeout requests without ErrorLogs join", async () => {
    queryRawUnsafe.mockResolvedValue([]);

    await getErrorLogs(25, 7);

    expect(queryRawUnsafe).toHaveBeenCalledOnce();
    const sql = String(queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain("model_proxy_requests");
    expect(sql).toContain(`"status" IN ('failed', 'timeout')`);
    expect(sql).not.toContain("LiteLLM_ErrorLogs");
    expect(sql).toContain('"error_type"');
    expect(sql).toContain('"upstream_model" as "litellm_model_name"');
    expect(sql).toContain("LIMIT 25");
  });
});
