import type { ChatMessage, SpendLog } from "@lite-llm/contracts/analytics";
import type {
  NormalizedMessage,
  NormalizedMessageRole,
  NormalizedThread,
} from "@/shared/types/automatic-interaction-thread";
import {
  extractSpendLogMessages,
  normalizeMessageContent,
} from "./extract-spend-log-messages";

function normalizeRole(role: string): NormalizedMessageRole {
  if (
    role === "user" ||
    role === "assistant" ||
    role === "system" ||
    role === "tool"
  ) {
    return role;
  }
  return "system";
}

function toNormalizedMessage(
  logId: string,
  msg: ChatMessage,
  index: number,
): NormalizedMessage {
  const metadata: NormalizedMessage["metadata"] = {
    source: "spend_log",
    rawPayloadRef: `messages[${index}]`,
  };

  if (msg.tool_calls != null && msg.tool_calls.length > 0) {
    metadata.tool_calls = msg.tool_calls;
  }

  if (msg.tool_call_id != null) {
    metadata.tool_call_id = msg.tool_call_id;
  }

  return {
    id: `${logId}-msg-${index}`,
    role: normalizeRole(msg.role),
    content: normalizeMessageContent(msg.content),
    metadata,
  };
}

export function normalizeSpendLogThread(log: SpendLog): NormalizedThread {
  const chatMessages = extractSpendLogMessages(log);

  return {
    id: log.request_id,
    source: "spend_log",
    messages: chatMessages.map((msg, index) =>
      toNormalizedMessage(log.request_id, msg, index),
    ),
  };
}
