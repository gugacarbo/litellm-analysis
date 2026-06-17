import { describe, expect, it } from "vitest";
import { normalizeProxyRequestLog } from "@/shared/lib/api-client/spend";
import { groupLogsByModel } from "../logs-table-utils";

function makeLog(requestId: string, model: string, startTime: string) {
  return normalizeProxyRequestLog({
    request_id: requestId,
    model,
    total_tokens: 10,
    prompt_tokens: 5,
    completion_tokens: 5,
    spend: 0.001,
    time_to_first_token_ms: 100,
    start_time: startTime,
    end_time: startTime,
    status: "200",
  });
}

describe("groupLogsByModel", () => {
  it("groups logs by model even when rows are interleaved", () => {
    const logs = [
      makeLog("a1", "model-a", "2026-05-01T10:00:00.000Z"),
      makeLog("b1", "model-b", "2026-05-01T09:59:00.000Z"),
      makeLog("a2", "model-a", "2026-05-01T09:58:00.000Z"),
    ];

    const groups = groupLogsByModel(logs);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.model).toBe("model-a");
    expect(groups[0]?.logs.map((log) => log.id)).toEqual(["a1", "a2"]);
    expect(groups[1]?.model).toBe("model-b");
    expect(groups[1]?.logs.map((log) => log.id)).toEqual(["b1"]);
  });
});
