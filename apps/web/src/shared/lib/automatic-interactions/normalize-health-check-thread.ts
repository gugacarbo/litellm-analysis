import type { HealthCheckResult } from "@lite-llm/contracts";
import type {
  NormalizedMessage,
  NormalizedThread,
} from "@/shared/types/automatic-interaction-thread";

export interface HealthCheckThreadInput {
  executionId: string;
  prompt: string;
  assistantText?: string | null;
  partialAssistantText?: string;
  isRunning?: boolean;
  timestamp?: number;
}

function buildUserMessage(
  executionId: string,
  prompt: string,
  timestamp?: number,
): NormalizedMessage {
  return {
    id: `${executionId}-user`,
    role: "user",
    content: prompt,
    metadata: {
      source: "health_check",
      timestamp,
      rawPayloadRef: "prompt",
    },
  };
}

function buildAssistantMessage(
  executionId: string,
  content: string,
  timestamp?: number,
): NormalizedMessage {
  return {
    id: `${executionId}-assistant`,
    role: "assistant",
    content,
    metadata: {
      source: "health_check",
      timestamp,
      rawPayloadRef: "response",
    },
  };
}

export function normalizeHealthCheckThread(
  input: HealthCheckThreadInput,
): NormalizedThread {
  const messages: NormalizedMessage[] = [
    buildUserMessage(input.executionId, input.prompt, input.timestamp),
  ];

  if (!input.isRunning) {
    messages.push(
      buildAssistantMessage(
        input.executionId,
        input.assistantText ?? "",
        input.timestamp,
      ),
    );
  }

  return {
    id: input.executionId,
    source: "health_check",
    messages,
    isRunning: input.isRunning,
    partialAssistantText: input.isRunning
      ? input.partialAssistantText
      : undefined,
  };
}

export function normalizeHealthCheckResultThread(
  executionId: string,
  result: HealthCheckResult,
): NormalizedThread {
  return normalizeHealthCheckThread({
    executionId,
    prompt: result.promptSent,
    assistantText: result.responseReceived,
    timestamp: result.checkedAt,
    isRunning: false,
  });
}
