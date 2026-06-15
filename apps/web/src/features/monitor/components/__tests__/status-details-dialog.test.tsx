import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RunningHealthCheckExecution } from "../../hooks/use-health-status-websocket";
import type { HealthCheckResultEntry } from "../../types/health-status-types";
import { StatusDetailsDialog } from "../status-details-dialog";

vi.mock("@/shared/components/assistant-ui/thread", () => {
  type MockPart = { type: "text"; text: string };
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
        </div>
      );
    },
  };
});

function createCompletedEntry(
  overrides: Partial<HealthCheckResultEntry> = {},
): HealthCheckResultEntry {
  return {
    id: 42,
    modelName: "gpt-4",
    status: "healthy",
    responseTimeMs: 1200,
    ttftMs: 300,
    outputTokens: 12,
    tokensPerSecond: 24,
    statusCode: 200,
    promptSent: "ping",
    responseReceived: "pong",
    requestPayload:
      '{"model":"gpt-4","messages":[{"role":"user","content":"ping"}]}',
    responsePayload:
      '{"choices":[{"message":{"role":"assistant","content":"pong"}}]}',
    errorMessage: null,
    source: "manual",
    checkedAt: 1_700_000_000_000,
    ...overrides,
  };
}

function createRunningExecution(
  overrides: Partial<RunningHealthCheckExecution> = {},
): RunningHealthCheckExecution {
  return {
    executionId: "exec-1",
    modelName: "gpt-4",
    prompt: "ping",
    startedAt: 1_700_000_000_000,
    ...overrides,
  };
}

describe("StatusDetailsDialog", () => {
  it("shows partial assistant text during a live stream", () => {
    const runningExecutions = new Map([["gpt-4", createRunningExecution()]]);
    const partialMessages = new Map([["exec-1", "po"]]);

    render(
      <StatusDetailsDialog
        selected={createCompletedEntry({ responseReceived: null })}
        runningExecutions={runningExecutions}
        partialMessages={partialMessages}
        onClose={() => {}}
      />,
    );

    expect(screen.getByTestId("mock-thread")).toBeInTheDocument();
    expect(screen.getByText("po")).toBeInTheDocument();
  });

  it("keeps raw request and response payloads accessible after completion", () => {
    const entry = createCompletedEntry();

    render(
      <StatusDetailsDialog
        selected={entry}
        runningExecutions={new Map()}
        partialMessages={new Map()}
        onClose={() => {}}
      />,
    );

    expect(
      screen.getByText((_, element) => {
        const text = element?.textContent ?? "";
        return (
          element?.tagName === "PRE" &&
          text.includes('"model": "gpt-4"') &&
          text.includes('"content": "ping"')
        );
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => {
        const text = element?.textContent ?? "";
        return (
          element?.tagName === "PRE" &&
          text.includes('"content": "pong"') &&
          text.includes("choices")
        );
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("mock-thread")).toHaveTextContent("pong");
  });
});
