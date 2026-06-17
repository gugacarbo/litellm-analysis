import type { ChatMessage } from "@lite-llm/contracts/analytics";
import type { ProxyRequestLog } from "@/shared/lib/api-client/spend";

function isChatMessageArray(value: unknown): value is ChatMessage[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) => {
    if (item == null || typeof item !== "object") return false;
    const role = (item as Record<string, unknown>).role;
    return typeof role === "string";
  });
}

export function normalizeMessageContent(
  content: ChatMessage["content"],
): string {
  if (typeof content === "string") return content.trim();
  if (content == null) return "";
  if (!Array.isArray(content)) return "";
  return content
    .filter((part) => part != null && typeof part === "object")
    .map((part) => (part.type === "text" ? (part.text ?? "") : ""))
    .join("")
    .trim();
}

function dedupKey(msg: ChatMessage): string {
  return `${msg.role}:${normalizeMessageContent(msg.content)}:${
    (msg.tool_calls ?? []).length
  }:${msg.tool_call_id ?? ""}`;
}

function extractResponseMessages(
  response: Record<string, unknown>,
): ChatMessage[] {
  const choices = response.choices;
  if (!Array.isArray(choices)) return [];

  const result: ChatMessage[] = [];

  for (const choice of choices) {
    if (choice == null || typeof choice !== "object") continue;
    const rawMsg = (choice as Record<string, unknown>).message;
    if (rawMsg == null || typeof rawMsg !== "object") continue;

    const messageRecord = rawMsg as Record<string, unknown>;
    const role = messageRecord.role;
    if (typeof role !== "string") continue;

    const message: ChatMessage = { role };

    if (typeof messageRecord.content === "string") {
      message.content = messageRecord.content;
    } else if (Array.isArray(messageRecord.content)) {
      message.content = messageRecord.content as ChatMessage["content"];
    }

    if (Array.isArray(messageRecord.tool_calls)) {
      message.tool_calls =
        messageRecord.tool_calls as ChatMessage["tool_calls"];
    }

    if (typeof messageRecord.tool_call_id === "string") {
      message.tool_call_id = messageRecord.tool_call_id;
    }

    if (typeof messageRecord.name === "string") {
      message.name = messageRecord.name;
    }

    result.push(message);
  }

  return result;
}

export function extractSpendLogMessages(log: ProxyRequestLog): ChatMessage[] {
  const requestMessages: ChatMessage[] = [];

  if (isChatMessageArray(log.messages) && log.messages.length > 0) {
    requestMessages.push(...log.messages);
  } else {
    const requestBodyMessages = log.request_body?.messages;
    if (isChatMessageArray(requestBodyMessages)) {
      requestMessages.push(...requestBodyMessages);
    }
  }

  const responseMessages: ChatMessage[] =
    log.response_body != null ? extractResponseMessages(log.response_body) : [];

  const seen = new Set(requestMessages.map(dedupKey));
  const combined = [...requestMessages];

  for (const msg of responseMessages) {
    if (!seen.has(dedupKey(msg))) {
      combined.push(msg);
      seen.add(dedupKey(msg));
    }
  }

  return combined;
}
