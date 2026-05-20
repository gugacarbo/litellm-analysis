import type {
  ChatMessage,
  ChatMessageContentPart,
  ChatToolCall,
  SpendLog,
} from "@lite-llm/contracts/analytics";

/* ────────────────────────────────────────────── type guards */

function isChatMessageArray(value: unknown): value is ChatMessage[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) => {
    if (item == null || typeof item !== "object") return false;
    const role = (item as Record<string, unknown>).role;
    return typeof role === "string";
  });
}

/* ────────────────────────────────────────────── helpers */

function normalizeText(content: ChatMessage["content"]): string {
  if (typeof content === "string") return content.trim();
  if (content == null) return "";
  if (!Array.isArray(content)) return "";
  return content
    .filter(
      (p): p is ChatMessageContentPart => p != null && typeof p === "object",
    )
    .map((p) => (p.type === "text" ? (p.text ?? "") : ""))
    .join("")
    .trim();
}

function dedupKey(msg: ChatMessage): string {
  return `${msg.role}:${normalizeText(msg.content)}:${
    (msg.tool_calls ?? []).length
  }:${msg.tool_call_id ?? ""}`;
}

/* ────────────────────────────────────────────── response extraction */

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

    const m = rawMsg as Record<string, unknown>;
    const role = m.role;
    if (typeof role !== "string") continue;

    const message: ChatMessage = { role };

    if (typeof m.content === "string") {
      message.content = m.content;
    } else if (Array.isArray(m.content)) {
      message.content = m.content as ChatMessageContentPart[];
    }

    if (Array.isArray(m.tool_calls)) {
      message.tool_calls = m.tool_calls as ChatToolCall[];
    }

    if (typeof m.tool_call_id === "string") {
      message.tool_call_id = m.tool_call_id;
    }

    if (typeof m.name === "string") {
      message.name = m.name;
    }

    result.push(message);
  }

  return result;
}

/* ────────────────────────────────────────────── main */

export function extractLogMessages(log: SpendLog): ChatMessage[] {
  const requestMessages: ChatMessage[] = [];

  if (isChatMessageArray(log.messages) && log.messages.length > 0) {
    requestMessages.push(...log.messages);
  } else {
    const proxyMessages = (
      log.proxy_server_request as Record<string, unknown> | null
    )?.messages;
    if (isChatMessageArray(proxyMessages)) {
      requestMessages.push(...proxyMessages);
    }
  }

  const responseMessages: ChatMessage[] =
    log.response != null && typeof log.response === "object"
      ? extractResponseMessages(log.response)
      : [];

  /* Deduplicate: skip response messages already present on request side */
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
