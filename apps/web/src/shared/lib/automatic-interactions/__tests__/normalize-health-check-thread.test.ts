import type { HealthCheckResult } from "@lite-llm/contracts";
import { describe, expect, it } from "vitest";
import {
  normalizeHealthCheckResultThread,
  normalizeHealthCheckThread,
} from "../normalize-health-check-thread";

function createHealthCheckResult(
  overrides: Partial<HealthCheckResult> = {},
): HealthCheckResult {
  return {
    id: 1,
    modelName: "gpt-4",
    status: "healthy",
    responseTimeMs: 500,
    ttftMs: 120,
    outputTokens: 10,
    tokensPerSecond: 20,
    statusCode: 200,
    promptSent: "ping",
    responseReceived: "pong",
    requestPayload: null,
    responsePayload: null,
    errorMessage: null,
    source: "manual",
    checkedAt: 1_700_000_000_000,
    ...overrides,
  };
}

describe("normalizeHealthCheckThread", () => {
  it("builds a minimal user to assistant conversation", () => {
    const thread = normalizeHealthCheckThread({
      executionId: "exec-1",
      prompt: "ping",
      assistantText: "pong",
      timestamp: 1_700_000_000_000,
    });

    expect(thread).toEqual({
      id: "exec-1",
      source: "health_check",
      messages: [
        {
          id: "exec-1-user",
          role: "user",
          content: "ping",
          metadata: {
            source: "health_check",
            timestamp: 1_700_000_000_000,
            rawPayloadRef: "prompt",
          },
        },
        {
          id: "exec-1-assistant",
          role: "assistant",
          content: "pong",
          metadata: {
            source: "health_check",
            timestamp: 1_700_000_000_000,
            rawPayloadRef: "response",
          },
        },
      ],
      isRunning: undefined,
      partialAssistantText: undefined,
    });
  });

  it("exposes partialAssistantText while running without assistant message", () => {
    const thread = normalizeHealthCheckThread({
      executionId: "exec-2",
      prompt: "ping",
      isRunning: true,
      partialAssistantText: "po",
    });

    expect(thread.isRunning).toBe(true);
    expect(thread.partialAssistantText).toBe("po");
    expect(thread.messages).toHaveLength(1);
    expect(thread.messages[0]?.role).toBe("user");
  });

  it("clears partialAssistantText when not running", () => {
    const thread = normalizeHealthCheckThread({
      executionId: "exec-3",
      prompt: "ping",
      assistantText: "pong",
      partialAssistantText: "ignored",
      isRunning: false,
    });

    expect(thread.partialAssistantText).toBeUndefined();
    expect(thread.messages).toHaveLength(2);
    expect(thread.messages[1]?.content).toBe("pong");
  });

  it("uses empty assistant content when assistantText is null", () => {
    const thread = normalizeHealthCheckThread({
      executionId: "exec-4",
      prompt: "ping",
      assistantText: null,
    });

    expect(thread.messages[1]?.content).toBe("");
  });
});

describe("normalizeHealthCheckResultThread", () => {
  it("maps a completed health check result to a normalized thread", () => {
    const result = createHealthCheckResult({
      promptSent: "Are you there?",
      responseReceived: "Yes",
      checkedAt: 1_700_000_000_123,
    });

    const thread = normalizeHealthCheckResultThread("exec-result-1", result);

    expect(thread.id).toBe("exec-result-1");
    expect(thread.source).toBe("health_check");
    expect(thread.isRunning).toBeFalsy();
    expect(thread.messages[0]?.content).toBe("Are you there?");
    expect(thread.messages[1]?.content).toBe("Yes");
    expect(thread.messages[1]?.metadata?.timestamp).toBe(1_700_000_000_123);
  });
});
