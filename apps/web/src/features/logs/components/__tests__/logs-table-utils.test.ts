import type { SpendLog } from "@lite-llm/contracts/analytics";
import { describe, expect, it } from "vitest";
import { groupLogsByModel } from "../logs-table-utils";

function makeLog(
  requestId: string,
  model: string,
  startTime: string,
): SpendLog {
  return {
    request_id: requestId,
    model,
    user: "user",
    total_tokens: 10,
    prompt_tokens: 5,
    completion_tokens: 5,
    spend: 0.001,
    time_to_first_token_ms: 100,
    start_time: startTime,
    end_time: startTime,
    api_key: "key",
    status: "200",
  };
}

describe("groupLogsByModel", () => {
  it("groups logs by model even when rows are interleaved", () => {
    const logs: SpendLog[] = [
      makeLog("a1", "model-a", "2026-05-01T10:00:00.000Z"),
      makeLog("b1", "model-b", "2026-05-01T09:59:00.000Z"),
      makeLog("a2", "model-a", "2026-05-01T09:58:00.000Z"),
    ];

    const groups = groupLogsByModel(logs);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.model).toBe("model-a");
    expect(groups[0]?.logs.map((log) => log.request_id)).toEqual(["a1", "a2"]);
    expect(groups[1]?.model).toBe("model-b");
    expect(groups[1]?.logs.map((log) => log.request_id)).toEqual(["b1"]);
  });
});
