import type { SpendLog } from "@lite-llm/api-contracts/analytics";
import { Bot, ChevronRight, Settings, User, Wrench } from "lucide-react";
import { Badge } from "../../ui/badge";
import { Card, CardContent } from "../../ui/card";
import {
  formatToolArgs,
  type ParsedMessage,
  parseConversation,
} from "../message-parser";

interface ChatDetailsTabProps {
  log: SpendLog;
}

const roleConfig = {
  user: {
    icon: User,
    bg: "bg-blue-500/5 border-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    label: "User",
  },
  assistant: {
    icon: Bot,
    bg: "bg-green-500/5 border-green-500/20",
    text: "text-green-600 dark:text-green-400",
    label: "Assistant",
  },
  system: {
    icon: Settings,
    bg: "bg-purple-500/5 border-purple-500/20",
    text: "text-purple-600 dark:text-purple-400",
    label: "System",
  },
  tool: {
    icon: Wrench,
    bg: "bg-amber-500/5 border-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    label: "Tool",
  },
};

function MessageCard({ message }: { message: ParsedMessage }) {
  const config = roleConfig[message.role] ?? roleConfig.user;
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border p-4 ${config.bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${config.text}`} />
        <span
          className={`text-xs font-medium uppercase tracking-wide ${config.text}`}
        >
          {config.label}
        </span>
        {message.name && (
          <Badge variant="outline" className="text-xs">
            {message.name}
          </Badge>
        )}
      </div>

      {message.content && (
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      )}

      {message.toolCallName && (
        <div className="mt-3 rounded border border-foreground/10 bg-background/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tool Call
            </span>
          </div>
          <div className="font-mono text-xs space-y-1">
            <div>
              <span className="text-muted-foreground">Function: </span>
              <span className="font-medium">{message.toolCallName}</span>
            </div>
            {message.toolCallArgs && (
              <div>
                <div className="text-muted-foreground mb-1">Arguments:</div>
                <pre className="bg-muted/50 p-2 rounded overflow-x-auto">
                  {formatToolArgs(message.toolCallArgs)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ToolCallCard({ name, args }: { name: string; args: string }) {
  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Wrench className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
          Tool Call
        </span>
      </div>
      <div className="font-mono text-xs">
        <div className="mb-2">
          <span className="text-muted-foreground">Function: </span>
          <span className="font-medium">{name}</span>
        </div>
        <div className="text-muted-foreground mb-1">Arguments:</div>
        <pre className="bg-muted/50 p-2 rounded overflow-x-auto">
          {formatToolArgs(args)}
        </pre>
      </div>
    </div>
  );
}

function ToolResultCard({
  toolCallId,
  output,
}: {
  toolCallId: string;
  output: string;
}) {
  return (
    <div className="rounded-lg border border-foreground/10 bg-muted/30 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Tool Result
        </span>
        <Badge variant="outline" className="text-xs font-mono">
          ID: {toolCallId.slice(0, 8)}...
        </Badge>
      </div>
      <pre className="text-xs whitespace-pre-wrap font-mono">{output}</pre>
    </div>
  );
}

export function ChatDetailsTab({ log }: ChatDetailsTabProps) {
  const { messages, toolCalls, toolResults } = parseConversation({
    messages: log.messages,
    response: log.response,
    mcp_namespaced_tool_name: log.mcp_namespaced_tool_name,
  });

  if (messages.length === 0 && toolCalls.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
          <div className="text-center">
            <p className="text-sm">No messages or tool calls found</p>
            <p className="text-xs mt-1">
              This request may not have used chat messages
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const timeline: Array<{
    type: "message" | "toolCall" | "toolResult";
    data:
      | ParsedMessage
      | { name: string; args: string }
      | { toolCallId: string; output: string };
  }> = [];

  for (const msg of messages) {
    if (msg.role === "assistant" && msg.toolCallName) {
      timeline.push({
        type: "toolCall",
        data: { name: msg.toolCallName, args: msg.toolCallArgs ?? "{}" },
      });
    } else if (msg.role === "tool") {
      timeline.push({ type: "message", data: msg });
      const result = toolResults.find((r) => r.toolCallId === msg.toolCallId);
      if (result) {
        timeline.push({ type: "toolResult", data: result });
      }
    } else {
      timeline.push({ type: "message", data: msg });
    }
  }

  for (const tc of toolCalls) {
    const hasToolCall = timeline.some(
      (item) =>
        item.type === "toolCall" &&
        (item.data as { name: string }).name === tc.name,
    );
    if (!hasToolCall) {
      timeline.push({
        type: "toolCall",
        data: { name: tc.name, args: tc.arguments },
      });
      const result = toolResults.find((r) => r.toolCallId === tc.id);
      if (result) {
        timeline.push({ type: "toolResult", data: result });
      }
    }
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{messages.length} messages</Badge>
            {toolCalls.length > 0 && (
              <Badge
                variant="outline"
                className="border-amber-500/30 text-amber-600 dark:text-amber-400"
              >
                {toolCalls.length} tool calls
              </Badge>
            )}
          </div>
        </div>

        <div className="max-h-[500px] overflow-y-auto pr-4">
          <div className="space-y-4">
            {timeline.map((item, idx) => {
              if (item.type === "message") {
                return (
                  <MessageCard
                    key={(item.data as ParsedMessage).id}
                    message={item.data as ParsedMessage}
                  />
                );
              }
              if (item.type === "toolCall") {
                const tc = item.data as { name: string; args: string };
                return (
                  <ToolCallCard
                    key={`tc-${idx}-${tc.name}`}
                    name={tc.name}
                    args={tc.args}
                  />
                );
              }
              if (item.type === "toolResult") {
                const tr = item.data as { toolCallId: string; output: string };
                return (
                  <ToolResultCard
                    key={`tr-${idx}-${tr.toolCallId}`}
                    toolCallId={tr.toolCallId}
                    output={tr.output}
                  />
                );
              }
              return null;
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
