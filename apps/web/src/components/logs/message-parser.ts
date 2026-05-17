export interface ParsedMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  name?: string;
  toolCallId?: string;
  toolCallName?: string;
  toolCallArgs?: string;
}

export interface ParsedToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface ParsedToolResult {
  toolCallId: string;
  output: string;
}

export interface ParsedConversation {
  messages: ParsedMessage[];
  toolCalls: ParsedToolCall[];
  toolResults: ParsedToolResult[];
}

interface RawMessage {
  role?: string;
  content?: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id?: string;
    name?: string;
    function?: {
      name?: string;
      arguments?: string;
    };
    type?: string;
  }>;
  function_call?: {
    name?: string;
    arguments?: string;
  };
}

interface LiteLLMResponse {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string | null;
      tool_calls?: Array<{
        id?: string;
        name?: string;
        function?: {
          name?: string;
          arguments?: string;
        };
        type?: string;
      }>;
      function_call?: {
        name?: string;
        arguments?: string;
      };
    };
  }>;
}

function generateId(): string {
  return `msg-${Math.random().toString(36).slice(2, 11)}`;
}

function extractToolCallsFromResponse(response: unknown): ParsedToolCall[] {
  if (!response || typeof response !== "object") return [];

  const typedResponse = response as LiteLLMResponse;
  if (!typedResponse.choices || !Array.isArray(typedResponse.choices)) {
    return [];
  }

  const toolCalls: ParsedToolCall[] = [];

  for (const choice of typedResponse.choices) {
    if (!choice.message) continue;

    if (choice.message.tool_calls && Array.isArray(choice.message.tool_calls)) {
      for (const toolCall of choice.message.tool_calls) {
        const name = toolCall.function?.name ?? toolCall.name ?? "unknown";
        const argumentsStr =
          typeof toolCall.function?.arguments === "string"
            ? toolCall.function.arguments
            : toolCall.function?.arguments
              ? JSON.stringify(toolCall.function.arguments)
              : "{}";

        toolCalls.push({
          id: toolCall.id ?? generateId(),
          name,
          arguments: argumentsStr,
        });
      }
    }

    if (
      choice.message.function_call &&
      typeof choice.message.function_call === "object"
    ) {
      const fc = choice.message.function_call;
      const name = typeof fc.name === "string" ? fc.name : "unknown";
      const argumentsStr =
        typeof fc.arguments === "string"
          ? fc.arguments
          : fc.arguments
            ? JSON.stringify(fc.arguments)
            : "{}";

      toolCalls.push({
        id: generateId(),
        name,
        arguments: argumentsStr,
      });
    }
  }

  return toolCalls;
}

function parseMessagesArray(messages: unknown): {
  messages: ParsedMessage[];
  toolResults: ParsedToolResult[];
} {
  const parsedMessages: ParsedMessage[] = [];
  const toolResults: ParsedToolResult[] = [];

  if (!messages || typeof messages !== "object") {
    return { messages: parsedMessages, toolResults };
  }

  if (Object.keys(messages).length === 0) {
    return { messages: parsedMessages, toolResults };
  }

  if (Array.isArray(messages)) {
    for (const msg of messages) {
      if (!msg || typeof msg !== "object") continue;

      const rawMsg = msg as RawMessage;
      const role = rawMsg.role?.toLowerCase() ?? "unknown";
      const content =
        typeof rawMsg.content === "string"
          ? rawMsg.content
          : rawMsg.content === null
            ? ""
            : "";

      if (role === "tool") {
        const toolResult: ParsedToolResult = {
          toolCallId: rawMsg.tool_call_id ?? "",
          output: content,
        };
        toolResults.push(toolResult);

        parsedMessages.push({
          id: generateId(),
          role: "tool",
          content,
          name: rawMsg.name,
          toolCallId: rawMsg.tool_call_id,
        });
      } else if (role === "user" || role === "assistant" || role === "system") {
        parsedMessages.push({
          id: generateId(),
          role,
          content,
          name: rawMsg.name,
        });
      }
    }
  }

  return { messages: parsedMessages, toolResults };
}

export function parseConversation(spendLog: {
  messages?: unknown;
  response?: unknown;
  mcp_namespaced_tool_name?: string;
}): ParsedConversation {
  const { messages: parsedMessages, toolResults } = parseMessagesArray(
    spendLog.messages,
  );

  const toolCalls = extractToolCallsFromResponse(spendLog.response);

  if (
    toolCalls.length > 0 &&
    parsedMessages.length === 0 &&
    spendLog.mcp_namespaced_tool_name
  ) {
    for (const tc of toolCalls) {
      parsedMessages.push({
        id: tc.id,
        role: "assistant",
        content: "",
        toolCallId: tc.id,
        toolCallName: tc.name,
        toolCallArgs: tc.arguments,
      });
    }
  }

  return {
    messages: parsedMessages,
    toolCalls,
    toolResults,
  };
}

export function formatToolArgs(args: string): string {
  try {
    const parsed = JSON.parse(args);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return args;
  }
}
