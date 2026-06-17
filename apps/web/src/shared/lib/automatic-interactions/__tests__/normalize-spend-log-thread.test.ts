import { describe, expect, it } from "vitest";
import { normalizeProxyRequestLog } from "@/shared/lib/api-client/spend";
import { normalizeSpendLogThread } from "../normalize-spend-log-thread";

function createProxyLog(overrides: Record<string, unknown> = {}) {
  return normalizeProxyRequestLog({
    request_id: "req-1",
    model: "gpt-4",
    total_tokens: 100,
    prompt_tokens: 50,
    completion_tokens: 50,
    spend: 0.01,
    time_to_first_token_ms: 120,
    start_time: "2026-01-01T00:00:00Z",
    end_time: "2026-01-01T00:00:01Z",
    status: "success",
    ...overrides,
  });
}

describe("normalizeSpendLogThread", () => {
  it("normalizes basic user and assistant messages", () => {
    const log = createProxyLog({
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ],
    });

    const thread = normalizeSpendLogThread(log);

    expect(thread).toEqual({
      id: "req-1",
      source: "spend_log",
      messages: [
        {
          id: "req-1-msg-0",
          role: "user",
          content: "Hello",
          metadata: {
            source: "spend_log",
            rawPayloadRef: "messages[0]",
          },
        },
        {
          id: "req-1-msg-1",
          role: "assistant",
          content: "Hi there",
          metadata: {
            source: "spend_log",
            rawPayloadRef: "messages[1]",
          },
        },
      ],
    });
  });

  it("preserves tool_calls on assistant messages", () => {
    const toolCalls = [
      {
        id: "call-1",
        type: "function",
        function: { name: "get_weather", arguments: '{"city":"NYC"}' },
      },
    ];

    const log = createProxyLog({
      messages: [
        { role: "user", content: "Weather?" },
        { role: "assistant", content: "", tool_calls: toolCalls },
      ],
    });

    const thread = normalizeSpendLogThread(log);
    const assistant = thread.messages[1];

    expect(assistant?.metadata?.tool_calls).toEqual(toolCalls);
    expect(assistant?.content).toBe("");
  });

  it("preserves tool_call_id on tool result messages", () => {
    const log = createProxyLog({
      messages: [
        { role: "user", content: "Weather?" },
        {
          role: "assistant",
          content: "",
          tool_calls: [
            {
              id: "call-1",
              type: "function",
              function: { name: "get_weather", arguments: "{}" },
            },
          ],
        },
        {
          role: "tool",
          content: '{"temp":72}',
          tool_call_id: "call-1",
        },
      ],
    });

    const thread = normalizeSpendLogThread(log);
    const toolMessage = thread.messages[2];

    expect(toolMessage?.role).toBe("tool");
    expect(toolMessage?.metadata?.tool_call_id).toBe("call-1");
    expect(toolMessage?.content).toBe('{"temp":72}');
  });

  it("deduplicates response messages already present in request", () => {
    const log = createProxyLog({
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ],
      response: {
        choices: [
          {
            message: {
              role: "assistant",
              content: "Hi there",
            },
          },
        ],
      },
    });

    const thread = normalizeSpendLogThread(log);

    expect(thread.messages).toHaveLength(2);
    expect(thread.messages.map((m) => m.content)).toEqual([
      "Hello",
      "Hi there",
    ]);
  });

  it("falls back to response.choices when messages are absent", () => {
    const log = createProxyLog({
      messages: undefined,
      response: {
        choices: [
          {
            message: {
              role: "assistant",
              content: "Response from choices",
            },
          },
        ],
      },
    });

    const thread = normalizeSpendLogThread(log);

    expect(thread.messages).toHaveLength(1);
    expect(thread.messages[0]).toMatchObject({
      role: "assistant",
      content: "Response from choices",
    });
  });

  it("falls back to proxy_server_request.messages when log.messages are absent", () => {
    const log = createProxyLog({
      messages: undefined,
      proxy_server_request: {
        messages: [{ role: "user", content: "From proxy" }],
      },
    });

    const thread = normalizeSpendLogThread(log);

    expect(thread.messages).toHaveLength(1);
    expect(thread.messages[0]).toMatchObject({
      role: "user",
      content: "From proxy",
    });
  });

  it("merges unique response messages after request messages", () => {
    const log = createProxyLog({
      messages: [{ role: "user", content: "Hello" }],
      response: {
        choices: [
          {
            message: {
              role: "assistant",
              content: "New response",
              tool_calls: [
                {
                  id: "call-2",
                  type: "function",
                  function: { name: "search", arguments: "{}" },
                },
              ],
            },
          },
        ],
      },
    });

    const thread = normalizeSpendLogThread(log);

    expect(thread.messages).toHaveLength(2);
    expect(thread.messages[1]?.metadata?.tool_calls).toHaveLength(1);
  });

  it("normalizes multipart text content to a single string", () => {
    const log = createProxyLog({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Hello " },
            { type: "text", text: "world" },
          ],
        },
      ],
    });

    const thread = normalizeSpendLogThread(log);

    expect(thread.messages[0]?.content).toBe("Hello world");
  });
});
