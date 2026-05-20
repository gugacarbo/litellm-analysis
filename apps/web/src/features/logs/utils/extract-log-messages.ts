import type { ChatMessage, SpendLog } from "@lite-llm/contracts/analytics";

function isChatMessageArray(value: unknown): value is ChatMessage[] {
  if (!Array.isArray(value)) return false;

  return value.every((item) => {
    if (item == null || typeof item !== "object") return false;
    const role = (item as Record<string, unknown>).role;
    return typeof role === "string";
  });
}

export function extractLogMessages(log: SpendLog): ChatMessage[] {
  if (isChatMessageArray(log.messages) && log.messages.length > 0) {
    return log.messages;
  }

  const requestBodyMessages = (
    log.proxy_server_request as Record<string, unknown> | null
  )?.messages;

  if (isChatMessageArray(requestBodyMessages)) {
    return requestBodyMessages;
  }

  return [];
}
