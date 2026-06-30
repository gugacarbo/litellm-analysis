import type { ChatToolCall } from "@lite-llm/contracts/analytics";

type AutomaticInteractionSource = "spend_log" | "health_check";

export type NormalizedMessageRole = "user" | "assistant" | "system" | "tool";

interface NormalizedMessageMetadata {
  tool_calls?: ChatToolCall[];
  tool_call_id?: string;
  source?: AutomaticInteractionSource;
  timestamp?: number;
  rawPayloadRef?: string;
}

export interface NormalizedMessage {
  id: string;
  role: NormalizedMessageRole;
  content: string;
  metadata?: NormalizedMessageMetadata;
}

export interface NormalizedThread {
  id: string;
  source: AutomaticInteractionSource;
  messages: NormalizedMessage[];
  isRunning?: boolean;
  partialAssistantText?: string;
}
