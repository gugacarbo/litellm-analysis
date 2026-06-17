import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { normalizeProxyRequestLog } from "@/shared/lib/api-client/spend";
import { normalizeHealthCheckThread } from "@/shared/lib/automatic-interactions/normalize-health-check-thread";
import { normalizeSpendLogThread } from "@/shared/lib/automatic-interactions/normalize-spend-log-thread";
import { LiveHealthCheckThread } from "../live-health-check-thread";
import { ReadonlyInteractionThread } from "../readonly-interaction-thread";

vi.mock("@/shared/components/assistant-ui/thread", () => {
  type MockPart =
    | { type: "text"; text: string }
    | { type: "tool-call"; toolName: string; result?: unknown };
  type MockMessage = { id: string; content: MockPart[] };

  return {
    Thread: function MockThread() {
      const { useAuiState } = require("@assistant-ui/react");
      const messages = useAuiState(
        (state: { thread: { messages: MockMessage[] } }) =>
          state.thread.messages,
      );

      return (
        <div data-testid="mock-thread">
          {messages.map((message: MockMessage) =>
            message.content
              .filter(
                (part: MockPart): part is { type: "text"; text: string } =>
                  part.type === "text",
              )
              .map((part, index) => (
                <span key={`${message.id}-${index}`}>{part.text}</span>
              )),
          )}
          {messages.flatMap((message: MockMessage) =>
            message.content
              .filter(
                (
                  part: MockPart,
                ): part is {
                  type: "tool-call";
                  toolName: string;
                } => part.type === "tool-call",
              )
              .map((part, index) => (
                <span key={`${message.id}-tool-${index}`}>{part.toolName}</span>
              )),
          )}
          {messages.flatMap((message: MockMessage) =>
            message.content
              .filter(
                (
                  part: MockPart,
                ): part is {
                  type: "tool-call";
                  toolName: string;
                  result: unknown;
                } => part.type === "tool-call" && part.result != null,
              )
              .map((part, index) => (
                <span key={`${message.id}-result-${index}`}>
                  {typeof part.result === "string"
                    ? part.result
                    : JSON.stringify(part.result)}
                </span>
              )),
          )}
        </div>
      );
    },
  };
});

describe("ReadonlyInteractionThread", () => {
  it("renders historical tool-call conversations", async () => {
    const thread = normalizeSpendLogThread(
      normalizeProxyRequestLog({
        request_id: "req-render",
        model: "gpt-4",
        total_tokens: 100,
        prompt_tokens: 50,
        completion_tokens: 50,
        spend: 0.01,
        time_to_first_token_ms: 120,
        start_time: "2026-01-01T00:00:00Z",
        end_time: "2026-01-01T00:00:01Z",
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
        ],
      }),
    );

    render(<ReadonlyInteractionThread thread={thread} />);

    await waitFor(() => {
      expect(screen.getByText("Weather?")).toBeInTheDocument();
      expect(screen.getByText("get_weather")).toBeInTheDocument();
      expect(screen.getByText('{"temp":72}')).toBeInTheDocument();
    });
  });
});

describe("LiveHealthCheckThread", () => {
  it("updates incrementally when delta handler is invoked", async () => {
    let appendDelta: ((delta: string) => void) | undefined;
    const initialThread = normalizeHealthCheckThread({
      executionId: "exec-live",
      prompt: "ping",
      isRunning: true,
      partialAssistantText: "",
    });

    render(
      <LiveHealthCheckThread
        executionId="exec-live"
        initialThread={initialThread}
        onDelta={(handler) => {
          appendDelta = handler;
        }}
      />,
    );

    await waitFor(() => {
      expect(appendDelta).toBeTypeOf("function");
    });

    appendDelta?.("po");
    appendDelta?.("ng");

    await waitFor(() => {
      expect(screen.getByText("pong")).toBeInTheDocument();
    });
  });
});
