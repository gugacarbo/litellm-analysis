import type { SpendLog } from "@lite-llm/contracts/analytics";
import { ChevronDown, ChevronRight, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/shared/lib/utils";

type Message = NonNullable<SpendLog["messages"]>[number];

type ChatSimulationProps = {
  messages: Message[];
};

type TextSegment = {
  type: "text";
  value: string;
};

type CodeSegment = {
  type: "code";
  value: string;
  lang: string | null;
};

type Segment = TextSegment | CodeSegment;

type ToolInfo = {
  id: string;
  name: string;
  argumentsText: string | null;
};

/* ────────────────────────────────────────────── helpers */

function parseContent(content: string): Segment[] {
  const parts: Segment[] = [];
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while (true) {
    match = codeBlockRegex.exec(content);
    if (match === null) break;

    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        value: content.slice(lastIndex, match.index),
      });
    }
    parts.push({
      type: "code",
      value: match[2]?.trim() ?? "",
      lang: match[1] ?? null,
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", value: content }];
}

function isContentPartArray(
  content: Message["content"],
): content is Array<{ type?: string; text?: string }> {
  return Array.isArray(content);
}

function normalizeContent(content: Message["content"]): string {
  if (typeof content === "string") return content;
  if (content == null) return "";
  if (!isContentPartArray(content)) return "";

  const textParts = content
    .map((part) => (part?.type === "text" ? (part.text ?? "") : ""))
    .filter(Boolean);

  return textParts.join("\n");
}

function parseToolCalls(msg: Message): ToolInfo[] {
  if (!Array.isArray(msg.tool_calls)) return [];

  return msg.tool_calls.map((toolCall, index) => ({
    id: toolCall?.id ?? `tool-${index}`,
    name: toolCall?.function?.name ?? "unknown_tool",
    argumentsText: toolCall?.function?.arguments ?? null,
  }));
}

/* ────────────────────────────────────────────── message parts */

function MessageContent({ content }: { content: string }) {
  const segments = useMemo(() => parseContent(content), [content]);

  return (
    <div className="space-y-2">
      {segments.map((segment, idx) =>
        segment.type === "code" ? (
          <div key={idx} className="relative">
            {segment.lang && (
              <span className="absolute top-1.5 right-2 text-[10px] uppercase tracking-wide text-muted-foreground/60 font-medium">
                {segment.lang}
              </span>
            )}
            <pre className="bg-muted/50 p-2.5 rounded-md font-mono text-xs overflow-x-auto">
              <code>{segment.value}</code>
            </pre>
          </div>
        ) : (
          <p key={idx} className="text-sm whitespace-pre-wrap leading-relaxed">
            {segment.value || (
              <span className="text-muted-foreground italic">No content</span>
            )}
          </p>
        ),
      )}
    </div>
  );
}

function ToolCallCard({ tool }: { tool: ToolInfo }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-md border bg-muted/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full cursor-pointer items-center gap-2 px-2.5 py-1.5 hover:bg-muted/60 transition-colors"
      >
        <Wrench className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          Tool call:
        </span>
        <span className="text-xs font-mono font-medium">{tool.name}</span>
        <span className="ml-auto">
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </span>
      </button>
      {open && tool.argumentsText && (
        <div className="px-2.5 pb-2.5 pt-1">
          <pre className="text-[11px] font-mono bg-background/80 rounded px-2 py-1.5 overflow-x-auto text-muted-foreground">
            {tool.argumentsText}
          </pre>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────── role messages */

function SystemMessage({ content }: { content: string }) {
  return (
    <div className="w-full">
      <span className="text-[10px] uppercase tracking-wide font-semibold text-purple-700 dark:text-purple-400 mb-1 block">
        System
      </span>
      <div className="rounded-md bg-purple-500/[0.04] border border-purple-500/10 px-3 py-2">
        <MessageContent content={content} />
      </div>
    </div>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex flex-col items-end gap-1 ml-auto max-w-[80%]">
      <span className="text-[10px] uppercase tracking-wide font-semibold text-blue-700 dark:text-blue-400 mr-1">
        You
      </span>
      <div className="rounded-xl rounded-tr-sm border border-blue-500/15 bg-blue-500/[0.05] px-3.5 py-2.5">
        <MessageContent content={content} />
      </div>
    </div>
  );
}

function AssistantMessage({
  content,
  toolCalls,
}: {
  content: string;
  toolCalls: ToolInfo[];
}) {
  return (
    <div className="flex flex-col items-start gap-1 mr-auto max-w-[80%]">
      <span className="text-[10px] uppercase tracking-wide font-semibold text-green-700 dark:text-green-400 ml-1">
        Assistant
      </span>
      <div className="rounded-xl rounded-tl-sm border border-green-500/15 bg-green-500/[0.05] px-3.5 py-2.5">
        {content && <MessageContent content={content} />}
        {toolCalls.length > 0 && (
          <div className={cn("space-y-1.5", content && "mt-2")}>
            {toolCalls.map((tool) => (
              <ToolCallCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
        {!content && toolCalls.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No content</p>
        )}
      </div>
    </div>
  );
}

function ToolResponse({
  content,
  toolName,
}: {
  content: string;
  toolName?: string;
}) {
  return (
    <div className="flex flex-col items-start gap-1 mr-auto max-w-[80%]">
      <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground ml-1">
        {toolName ? (
          <>
            Tool result: <span className="font-mono">{toolName}</span>
          </>
        ) : (
          "Tool result"
        )}
      </span>
      <div className="rounded-xl rounded-tl-sm border border-border bg-muted/40 px-3.5 py-2.5">
        <MessageContent content={content} />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────── main */

export function ChatSimulation({ messages }: ChatSimulationProps) {
  /* Build a map from tool_call_id → tool name so tool responses show cleanly */
  const toolNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const msg of messages) {
      for (const tool of parseToolCalls(msg)) {
        map.set(tool.id, tool.name);
      }
    }
    return map;
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        No messages available
      </div>
    );
  }

  return (
    <div className="space-y-5 py-2">
      {messages.map((msg, index) => {
        const normalizedContent = normalizeContent(msg.content);
        const role = msg.role;
        const delayStyle = { animationDelay: `${index * 50}ms` };

        return (
          <div
            key={index}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={delayStyle}
          >
            {role === "system" && normalizedContent && (
              <SystemMessage content={normalizedContent} />
            )}

            {role === "user" && (
              <UserMessage content={normalizedContent || "No content"} />
            )}

            {role === "assistant" && (
              <AssistantMessage
                content={normalizedContent}
                toolCalls={parseToolCalls(msg)}
              />
            )}

            {role === "tool" && (
              <ToolResponse
                content={normalizedContent || "No content"}
                toolName={
                  msg.tool_call_id
                    ? toolNameById.get(msg.tool_call_id)
                    : undefined
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
