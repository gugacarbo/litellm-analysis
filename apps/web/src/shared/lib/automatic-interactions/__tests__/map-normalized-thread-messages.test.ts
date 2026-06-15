import { describe, expect, it } from "vitest";
import { mapNormalizedThreadToThreadMessages } from "../map-normalized-thread-messages";
import { normalizeHealthCheckThread } from "../normalize-health-check-thread";
import { normalizeSpendLogThread } from "../normalize-spend-log-thread";

describe("mapNormalizedThreadToThreadMessages", () => {
  it("maps historical spend-log threads with linked tool calls and results", () => {
    const thread = normalizeSpendLogThread({
      request_id: "req-tools",
      model: "gpt-4",
      user: "test-user",
      total_tokens: 100,
      prompt_tokens: 50,
      completion_tokens: 50,
      spend: 0.01,
      time_to_first_token_ms: 120,
      start_time: "2026-01-01T00:00:00Z",
      end_time: "2026-01-01T00:00:01Z",
      api_key: "sk-test",
      status: "success",
      messages: [
        { role: "user", content: "Weather?" },
        {
          role: "assistant",
          content: "",
          tool_calls: [
            {
              id: "call-1",
              type: "function",
              function: {
                name: "get_weather",
                arguments: '{"city":"NYC"}',
              },
            },
          ],
        },
        {
          role: "tool",
          content: '{"temp":72}',
          tool_call_id: "call-1",
        },
        { role: "assistant", content: "It is 72F in NYC." },
      ],
    });

    const messages = mapNormalizedThreadToThreadMessages(thread);

    expect(messages).toHaveLength(2);
    expect(messages[0]?.role).toBe("user");
    expect(messages[1]?.role).toBe("assistant");

    const toolCallMessage = messages[1];
    if (toolCallMessage?.role !== "assistant") {
      throw new Error("Expected assistant message with tool call");
    }

    const toolCallPart = toolCallMessage.content.find(
      (part) => part.type === "tool-call",
    );
    expect(toolCallPart?.type).toBe("tool-call");
    if (toolCallPart?.type !== "tool-call") {
      throw new Error("Expected tool-call part");
    }

    expect(toolCallPart.toolCallId).toBe("call-1");
    expect(toolCallPart.toolName).toBe("get_weather");
    expect(toolCallPart.result).toBe('{"temp":72}');
    expect(
      toolCallMessage.content.find((part) => part.type === "text")?.text,
    ).toBe("It is 72F in NYC.");
  });

  it("appends a running assistant message for partial health-check text", () => {
    const runningThread = normalizeHealthCheckThread({
      executionId: "exec-1",
      prompt: "ping",
      isRunning: true,
      partialAssistantText: "pong",
    });

    const messages = mapNormalizedThreadToThreadMessages(runningThread);
    const lastMessage = messages.at(-1);

    expect(lastMessage?.role).toBe("assistant");
    if (lastMessage?.role === "assistant") {
      expect(lastMessage.status.type).toBe("running");
      expect(
        lastMessage.content.find((part) => part.type === "text")?.text,
      ).toBe("pong");
    }
  });
});
