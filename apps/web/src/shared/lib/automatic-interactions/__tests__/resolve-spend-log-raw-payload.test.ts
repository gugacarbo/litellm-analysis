import type { SpendLog } from "@lite-llm/contracts/analytics";
import { describe, expect, it } from "vitest";
import { resolveSpendLogRawPayload } from "../resolve-spend-log-raw-payload";

const baseLog: SpendLog = {
  request_id: "req-raw",
  model: "gpt-4",
  user: "test-user",
  total_tokens: 10,
  prompt_tokens: 5,
  completion_tokens: 5,
  spend: 0.01,
  time_to_first_token_ms: 100,
  start_time: "2026-01-01T00:00:00Z",
  end_time: "2026-01-01T00:00:01Z",
  api_key: "sk-test",
  status: "success",
  messages: [
    { role: "user", content: "hello" },
    { role: "assistant", content: "hi" },
  ],
};

describe("resolveSpendLogRawPayload", () => {
  it("returns extracted message by index ref", () => {
    expect(resolveSpendLogRawPayload(baseLog, "messages[0]")).toEqual({
      role: "user",
      content: "hello",
    });
    expect(resolveSpendLogRawPayload(baseLog, "messages[1]")).toEqual({
      role: "assistant",
      content: "hi",
    });
  });

  it("returns undefined for invalid refs", () => {
    expect(resolveSpendLogRawPayload(baseLog, "prompt")).toBeUndefined();
    expect(resolveSpendLogRawPayload(baseLog, "messages[99]")).toBeUndefined();
    expect(resolveSpendLogRawPayload(baseLog, "messages[-1]")).toBeUndefined();
  });
});
