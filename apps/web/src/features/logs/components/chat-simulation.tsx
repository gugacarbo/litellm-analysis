import type { SpendLog } from "@lite-llm/contracts/analytics";
import { useMemo } from "react";
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

const roleConfig: Record<
  string,
  {
    align: "left" | "right";
    bg: string;
    border: string;
    labelBg: string;
    labelText: string;
    label: string;
  }
> = {
  system: {
    align: "left",
    bg: "bg-purple-500/5",
    border: "border-purple-500/20",
    labelBg: "bg-purple-500/15",
    labelText: "text-purple-700 dark:text-purple-400",
    label: "System",
  },
  user: {
    align: "right",
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
    labelBg: "bg-blue-500/15",
    labelText: "text-blue-700 dark:text-blue-400",
    label: "User",
  },
  assistant: {
    align: "left",
    bg: "bg-green-500/5",
    border: "border-green-500/20",
    labelBg: "bg-green-500/15",
    labelText: "text-green-700 dark:text-green-400",
    label: "Assistant",
  },
  tool: {
    align: "left",
    bg: "bg-muted/50",
    border: "border-border",
    labelBg: "bg-muted",
    labelText: "text-muted-foreground",
    label: "Tool",
  },
};

function getRoleConfig(role: string) {
  return roleConfig[role] ?? roleConfig.tool;
}

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
            <pre className="bg-muted/50 p-3 rounded-lg font-mono text-xs overflow-x-auto">
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

export function ChatSimulation({ messages }: ChatSimulationProps) {
  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        No messages available
      </div>
    );
  }

  return (
    <div className="max-h-[600px] overflow-y-auto space-y-4 p-4 bg-muted/20 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
      {messages.map((msg, index) => {
        const config = getRoleConfig(msg.role);
        const isRight = config.align === "right";

        return (
          <div
            key={index}
            className={cn(
              "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
              isRight ? "flex-row-reverse" : "flex-row",
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className={cn(
                "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold uppercase tracking-wider",
                config.labelBg,
                config.labelText,
              )}
              title={msg.role}
            >
              {config.label.slice(0, 1)}
            </div>
            <div className={cn("flex-1 max-w-[85%]", isRight && "items-end")}>
              <div
                className={cn(
                  "rounded-xl border p-3.5",
                  config.bg,
                  config.border,
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-2 mb-2",
                    isRight && "justify-end",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      config.labelBg,
                      config.labelText,
                    )}
                  >
                    {config.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 font-medium">
                    #{index + 1}
                  </span>
                </div>
                <MessageContent content={msg.content} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
