import {
  unstable_createMessageConverter as createMessageConverter,
  type ThreadMessage,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import type {
  NormalizedMessage,
  NormalizedThread,
} from "@/shared/types/automatic-interaction-thread";

type ExternalMessage =
  | (ThreadMessageLike & {
      convertConfig?: { joinStrategy?: "concat-content" | "none" };
    })
  | {
      role: "tool";
      toolCallId: string;
      toolName?: string;
      result: string;
      isError?: boolean;
    };

type AssistantContentPart = Exclude<
  ThreadMessageLike["content"],
  string
>[number];

function metadataCustom(
  metadata: NormalizedMessage["metadata"],
): Record<string, unknown> {
  return metadata ? { ...metadata } : {};
}

function normalizedMessageToExternalMessage(
  message: NormalizedMessage,
): ExternalMessage {
  switch (message.role) {
    case "user":
    case "system":
      return {
        id: message.id,
        role: message.role,
        content: message.content,
        metadata: {
          custom: metadataCustom(message.metadata),
        },
      };

    case "assistant": {
      const parts: AssistantContentPart[] = [];

      if (message.content.trim().length > 0) {
        parts.push({ type: "text", text: message.content });
      }

      for (const toolCall of message.metadata?.tool_calls ?? []) {
        parts.push({
          type: "tool-call",
          toolCallId: toolCall.id,
          toolName: toolCall.function?.name ?? "tool",
          argsText: toolCall.function?.arguments ?? "{}",
        });
      }

      return {
        id: message.id,
        role: "assistant",
        content: parts.length > 0 ? parts : message.content,
        metadata: {
          custom: metadataCustom(message.metadata),
        },
      };
    }

    case "tool":
      if (message.metadata?.tool_call_id) {
        return {
          role: "tool",
          toolCallId: message.metadata.tool_call_id,
          result: message.content,
        };
      }

      return {
        id: message.id,
        role: "assistant",
        content: [
          {
            type: "tool-call",
            toolCallId: message.id,
            toolName: "tool",
            argsText: "{}",
            result: message.content,
          },
        ],
        convertConfig: { joinStrategy: "none" },
        metadata: {
          custom: metadataCustom(message.metadata),
        },
      };

    default: {
      const unsupportedRole: never = message.role;
      return {
        id: message.id,
        role: "system",
        content: `Unsupported role: ${unsupportedRole}`,
      };
    }
  }
}

const normalizedMessageConverter = createMessageConverter<NormalizedMessage>(
  (message) => normalizedMessageToExternalMessage(message),
);

function threadMessagesForConversion(
  thread: NormalizedThread,
): NormalizedMessage[] {
  const messages = [...thread.messages];

  if (
    thread.isRunning &&
    thread.partialAssistantText !== undefined &&
    thread.partialAssistantText.length > 0
  ) {
    messages.push({
      id: `${thread.id}-assistant-partial`,
      role: "assistant",
      content: thread.partialAssistantText,
      metadata: {
        source: thread.source,
        rawPayloadRef: "partialAssistantText",
      },
    });
  }

  return messages;
}

export function mapNormalizedThreadToThreadMessages(
  thread: NormalizedThread,
): ThreadMessage[] {
  return normalizedMessageConverter.toThreadMessages(
    threadMessagesForConversion(thread),
    thread.isRunning ?? false,
  );
}
