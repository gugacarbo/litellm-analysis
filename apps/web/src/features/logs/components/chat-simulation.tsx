import type {
  ChatMessageContentPart,
  SpendLog,
} from "@lite-llm/contracts/analytics";
import { ChevronDown, ChevronRight, Wrench } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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

type TaggedTextPiece =
  | {
      type: "text";
      value: string;
    }
  | {
      type: "tag";
      tag: string;
      value: string;
      attributes: Record<string, string>;
    };

type ToolInfo = {
  id: string;
  name: string;
  argumentsText: string | null;
};

type LinkedToolResult = {
  key: string;
  content: string;
  rawMessage: string;
};

type ContentMeta = {
  text: string;
  hasImagePart: boolean;
  unknownPartTypes: string[];
};

/* ────────────────────────────────────────────── helpers */

function decodeEscapedNewlines(value: string): string {
  return value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n");
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

function isContentPartArray(
  content: Message["content"],
): content is ChatMessageContentPart[] {
  return Array.isArray(content);
}

function getContentMeta(content: Message["content"]): ContentMeta {
  if (typeof content === "string") {
    return {
      text: content,
      hasImagePart: false,
      unknownPartTypes: [],
    };
  }

  if (content == null || !isContentPartArray(content)) {
    return {
      text: "",
      hasImagePart: false,
      unknownPartTypes: [],
    };
  }

  const textParts: string[] = [];
  let hasImagePart = false;
  const unknownPartTypes = new Set<string>();

  for (const part of content) {
    if (part?.type === "text") {
      if (part.text) textParts.push(part.text);
      continue;
    }

    if (part?.type === "image_url" && part.image_url?.url) {
      hasImagePart = true;
      continue;
    }

    unknownPartTypes.add(part?.type ?? "unknown");
  }

  return {
    text: textParts.join("\n"),
    hasImagePart,
    unknownPartTypes: [...unknownPartTypes],
  };
}

function parseToolCalls(msg: Message): ToolInfo[] {
  if (!Array.isArray(msg.tool_calls)) return [];

  return msg.tool_calls.map((toolCall, index) => ({
    id: toolCall?.id ?? `tool-${index}`,
    name: toolCall?.function?.name ?? "unknown_tool",
    argumentsText: toolCall?.function?.arguments ?? null,
  }));
}

function parseTaggedText(content: string): TaggedTextPiece[] {
  const pieces: TaggedTextPiece[] = [];
  const tagRegex = /<([a-zA-Z_][\w-]*)(\s+[^>]*)?>([\s\S]*?)<\/\1>/g;
  const attrRegex = /([\w-]+)="([^"]*)"/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while (true) {
    match = tagRegex.exec(content);
    if (match === null) break;

    if (match.index > lastIndex) {
      pieces.push({
        type: "text",
        value: content.slice(lastIndex, match.index),
      });
    }

    const rawAttributes = match[2] ?? "";
    const attributes: Record<string, string> = {};
    let attrMatch: RegExpExecArray | null;
    while (true) {
      attrMatch = attrRegex.exec(rawAttributes);
      if (attrMatch === null) break;
      attributes[attrMatch[1]] = attrMatch[2];
    }
    attrRegex.lastIndex = 0;

    pieces.push({
      type: "tag",
      tag: match[1],
      value: match[3] ?? "",
      attributes,
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    pieces.push({
      type: "text",
      value: content.slice(lastIndex),
    });
  }

  return pieces;
}

function extractSkillName(
  value: string,
  attributes: Record<string, string>,
): string | undefined {
  if (attributes.name) return attributes.name;
  const nameMatch = value.match(/<name>([^<]*)<\/name>/);
  if (nameMatch) return nameMatch[1].trim();
  return undefined;
}

function TaggedSectionCard({
  tag,
  value,
  attributes,
}: {
  tag: string;
  value: string;
  attributes: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);

  let headerLabel: string;
  if (tag === "skill_content") {
    const name = extractSkillName(value, attributes);
    headerLabel = name ? `Skill: ${name}` : tag;
  } else if (tag === "name") {
    headerLabel = `Skill: ${value.trim()}`;
  } else {
    headerLabel = tag;
  }

  return (
    <div className="overflow-hidden rounded-md border bg-background/40">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2 border-b bg-muted/50 px-2 py-0.5 text-left"
      >
        {open ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        )}
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {headerLabel}
        </span>
      </button>

      {open && (
        <pre className="whitespace-pre-wrap break-words px-2.5 py-1 text-[12px] font-mono leading-relaxed text-foreground/90">
          {value.trim()}
        </pre>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────── message parts */

function MessageContent({ content }: { content: string }) {
  const segments = useMemo(() => parseContent(content), [content]);

  return (
    <div className="space-y-1">
      {segments.map((segment, idx) =>
        segment.type === "code" ? (
          <div key={idx} className="relative">
            {segment.lang && (
              <span className="absolute top-1.5 right-2 text-[10px] uppercase tracking-wide text-muted-foreground/60 font-medium">
                {segment.lang}
              </span>
            )}
            <pre className="overflow-x-hidden whitespace-pre-wrap break-words rounded-md bg-muted/50 p-2.5 font-mono text-xs">
              <code>{segment.value}</code>
            </pre>
          </div>
        ) : (
          <div key={idx} className="space-y-1">
            {segment.value ? (
              parseTaggedText(segment.value).map((piece, pieceIdx) =>
                piece.type === "text" ? (
                  <p
                    key={`${idx}-text-${pieceIdx}`}
                    className="text-sm whitespace-pre-wrap break-words leading-relaxed"
                  >
                    {piece.value}
                  </p>
                ) : (
                  <TaggedSectionCard
                    key={`${idx}-tag-${pieceIdx}`}
                    tag={piece.tag}
                    value={piece.value}
                    attributes={piece.attributes}
                  />
                ),
              )
            ) : (
              <span className="text-muted-foreground italic">No content</span>
            )}
          </div>
        ),
      )}
    </div>
  );
}

function ToolCallCard({
  tool,
  linkedResults,
}: {
  tool: ToolInfo;
  linkedResults?: LinkedToolResult[];
}) {
  const [open, setOpen] = useState(false);
  const [openResults, setOpenResults] = useState(false);

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
        <span className="text-left text-xs font-mono font-medium break-all">
          {tool.name}
        </span>
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
          <pre className="overflow-x-hidden whitespace-pre-wrap break-all rounded bg-background/80 px-2 py-1.5 font-mono text-[11px] text-muted-foreground">
            {tool.argumentsText}
          </pre>
        </div>
      )}

      {linkedResults && linkedResults.length > 0 && (
        <div className="border-t bg-background/40 px-2.5 py-1.5">
          <button
            type="button"
            onClick={() => setOpenResults((prev) => !prev)}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            {openResults ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Result {linkedResults.length > 1 ? `(${linkedResults.length})` : ""}
          </button>

          {openResults && (
            <div className="mt-1.5 space-y-1.5">
              {linkedResults.map((result) => (
                <RawMessageBlock
                  key={result.key}
                  rawMessage={result.rawMessage}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MessageFlags({ flags }: { flags: string[] }) {
  if (flags.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {flags.map((flag) => (
        <span
          key={flag}
          className="rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
        >
          {flag}
        </span>
      ))}
    </div>
  );
}

function ContentPartHints({ meta }: { meta: ContentMeta }) {
  if (!meta.hasImagePart && meta.unknownPartTypes.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {meta.hasImagePart && (
        <span className="rounded-md border border-border bg-background/70 px-2 py-0.5 text-[11px] text-muted-foreground">
          Image attachment
        </span>
      )}
      {meta.unknownPartTypes.map((partType) => (
        <span
          key={partType}
          className="rounded-md border border-dashed border-border bg-background/70 px-2 py-0.5 text-[11px] text-muted-foreground"
        >
          Part: {partType}
        </span>
      ))}
    </div>
  );
}

function MessageDetails({
  meta,
  flags,
}: {
  meta: ContentMeta;
  flags: string[];
}) {
  const [open, setOpen] = useState(false);
  const hasDetails =
    flags.length > 0 || meta.hasImagePart || meta.unknownPartTypes.length > 0;

  if (!hasDetails) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        Detalhes
      </button>

      {open && (
        <div className="mt-1.5">
          <ContentPartHints meta={meta} />
          <MessageFlags flags={flags} />
        </div>
      )}
    </div>
  );
}

function tryParseJsonString(value: string): unknown {
  const trimmed = value.trim();
  const looksLikeJson =
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"));

  if (!looksLikeJson) {
    return value;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function normalizeRawValue(value: unknown): unknown {
  if (typeof value === "string") {
    const parsed = tryParseJsonString(value);
    if (parsed === value) {
      return value;
    }

    return normalizeRawValue(parsed);
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeRawValue(item));
  }

  if (value != null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(
      ([key, nested]) => [key, normalizeRawValue(nested)] as const,
    );

    return Object.fromEntries(entries);
  }

  return value;
}

function formatRawMessage(rawMessage: string): string {
  const trimmed = rawMessage.trim();
  if (!trimmed) {
    return "No content";
  }

  try {
    const parsed = JSON.parse(trimmed);
    const normalized = normalizeRawValue(parsed);
    return decodeEscapedNewlines(JSON.stringify(normalized, null, 2));
  } catch {
    return decodeEscapedNewlines(trimmed);
  }
}

function RawMessageBlock({ rawMessage }: { rawMessage: string }) {
  const rawContent = formatRawMessage(rawMessage);

  return (
    <pre className="overflow-x-hidden whitespace-pre-wrap break-words rounded-md bg-muted/60 p-2.5 font-mono text-xs text-foreground/90">
      {`\`\`\`json
${rawContent}
\`\`\``}
    </pre>
  );
}

/* ────────────────────────────────────────────── role messages */

function SystemMessage({
  content,
  meta,
  flags,
  rawMessage,
}: {
  content: string;
  meta: ContentMeta;
  flags: string[];
  rawMessage: string;
}) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide font-semibold text-purple-700 dark:text-purple-400">
          System
        </span>
        <button
          type="button"
          onClick={() => setShowRaw((prev) => !prev)}
          className="rounded border border-border/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground"
        >
          {showRaw ? "Render" : "Raw"}
        </button>
      </div>
      <div className="rounded-md bg-purple-500/[0.04] border border-purple-500/10 px-3 py-2">
        {showRaw ? (
          <RawMessageBlock rawMessage={rawMessage} />
        ) : content ? (
          <MessageContent content={content} />
        ) : (
          <p className="text-sm text-muted-foreground italic">No content</p>
        )}
        {!showRaw && <MessageDetails meta={meta} flags={flags} />}
      </div>
    </div>
  );
}

function UserMessage({
  content,
  meta,
  flags,
  rawMessage,
}: {
  content: string;
  meta: ContentMeta;
  flags: string[];
  rawMessage: string;
}) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="flex flex-col items-end gap-1 ml-auto max-w-[75%]">
      <div className="mr-1 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide font-semibold text-blue-700 dark:text-blue-400">
          You
        </span>
        <button
          type="button"
          onClick={() => setShowRaw((prev) => !prev)}
          className="rounded border border-border/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground"
        >
          {showRaw ? "Render" : "Raw"}
        </button>
      </div>
      <div className="rounded-xl rounded-tr-sm border border-blue-500/15 bg-blue-500/[0.05] px-3.5 py-2.5">
        {showRaw ? (
          <RawMessageBlock rawMessage={rawMessage} />
        ) : content ? (
          <MessageContent content={content} />
        ) : (
          <p className="text-sm text-muted-foreground italic">No content</p>
        )}
        {!showRaw && <MessageDetails meta={meta} flags={flags} />}
      </div>
    </div>
  );
}

function AssistantMessage({
  content,
  meta,
  toolCalls,
  toolResultsByCallId,
  flags,
  rawMessage,
}: {
  content: string;
  meta: ContentMeta;
  toolCalls: ToolInfo[];
  toolResultsByCallId: Map<string, LinkedToolResult[]>;
  flags: string[];
  rawMessage: string;
}) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="flex flex-col items-start gap-1 mr-auto max-w-[75%]">
      <div className="ml-1 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide font-semibold text-green-700 dark:text-green-400">
          Assistant
        </span>
        <button
          type="button"
          onClick={() => setShowRaw((prev) => !prev)}
          className="rounded border border-border/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground"
        >
          {showRaw ? "Render" : "Raw"}
        </button>
      </div>
      <div className="rounded-xl rounded-tl-sm border border-green-500/15 bg-green-500/[0.05] px-3.5 py-2.5">
        {showRaw ? (
          <RawMessageBlock rawMessage={rawMessage} />
        ) : (
          <>
            {content && <MessageContent content={content} />}
            {toolCalls.length > 0 && (
              <div className={cn("space-y-1.5", content && "mt-2")}>
                {toolCalls.map((tool) => (
                  <ToolCallCard
                    key={tool.id}
                    tool={tool}
                    linkedResults={toolResultsByCallId.get(tool.id)}
                  />
                ))}
              </div>
            )}
            <MessageDetails meta={meta} flags={flags} />
            {!content && toolCalls.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No content</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ToolResponse({
  content,
  meta,
  toolName,
  flags,
  rawMessage,
}: {
  content: string;
  meta: ContentMeta;
  toolName?: string;
  flags: string[];
  rawMessage: string;
}) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="flex flex-col items-start gap-1 mr-auto max-w-[75%]">
      <div className="ml-1 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
          {toolName ? (
            <>
              Tool result: <span className="font-mono">{toolName}</span>
            </>
          ) : (
            "Tool result"
          )}
        </span>
        <button
          type="button"
          onClick={() => setShowRaw((prev) => !prev)}
          className="rounded border border-border/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground"
        >
          {showRaw ? "Render" : "Raw"}
        </button>
      </div>
      <div className="rounded-xl rounded-tl-sm border border-border bg-muted/40 px-3.5 py-2.5">
        {showRaw ? (
          <RawMessageBlock rawMessage={rawMessage} />
        ) : content ? (
          <MessageContent content={content} />
        ) : (
          <p className="text-sm text-muted-foreground italic">No content</p>
        )}
        {!showRaw && <MessageDetails meta={meta} flags={flags} />}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────── main */

export function ChatSimulation({ messages }: ChatSimulationProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = scrollContainerRef.current;
    if (!element) return;

    const rafId = requestAnimationFrame(() => {
      element.scrollTop = element.scrollHeight;
    });

    return () => cancelAnimationFrame(rafId);
  });

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
    <div className="rounded-lg border bg-muted/10 p-2">
      <div
        ref={scrollContainerRef}
        className="h-[460px] max-h-[70vh] overflow-y-auto overflow-x-hidden rounded-md bg-background/60 px-2 py-3"
      >
        <div className="space-y-5">
          {(() => {
            const consumedToolIndexes = new Set<number>();
            const rows: React.ReactNode[] = [];

            for (let index = 0; index < messages.length; index++) {
              if (consumedToolIndexes.has(index)) {
                continue;
              }

              const msg = messages[index];
              const contentMeta = getContentMeta(msg.content);
              const normalizedContent = contentMeta.text;
              const toolCalls = parseToolCalls(msg);
              const role = msg.role;
              const rawMessage = JSON.stringify(msg, null, 2);
              const delayStyle = { animationDelay: `${index * 50}ms` };

              const flags: string[] = [];
              if (toolCalls.length > 0) {
                flags.push(`tool-calls:${toolCalls.length}`);
              }
              if (role === "tool") {
                flags.push("tool-result");
              }
              if (!normalizedContent.trim()) {
                flags.push("no-text");
              }
              if (
                contentMeta.hasImagePart ||
                contentMeta.unknownPartTypes.length > 0
              ) {
                flags.push("multimodal");
              }

              const toolResultsByCallId = new Map<string, LinkedToolResult[]>();

              if (role === "assistant" && toolCalls.length > 0) {
                const toolIds = new Set(toolCalls.map((tool) => tool.id));

                for (
                  let nextIndex = index + 1;
                  nextIndex < messages.length;
                  nextIndex++
                ) {
                  const candidate = messages[nextIndex];

                  if (
                    candidate.role === "assistant" ||
                    candidate.role === "user" ||
                    candidate.role === "system"
                  ) {
                    break;
                  }

                  if (candidate.role !== "tool") {
                    continue;
                  }

                  const toolCallId = candidate.tool_call_id;
                  if (!toolCallId || !toolIds.has(toolCallId)) {
                    continue;
                  }

                  consumedToolIndexes.add(nextIndex);

                  const candidateMeta = getContentMeta(candidate.content);
                  const candidateContent = candidateMeta.text || "No content";
                  const candidateRaw = JSON.stringify(candidate, null, 2);
                  const linkedResult: LinkedToolResult = {
                    key: `${nextIndex}-${toolCallId}`,
                    content: candidateContent,
                    rawMessage: candidateRaw,
                  };

                  const previous = toolResultsByCallId.get(toolCallId) ?? [];
                  previous.push(linkedResult);
                  toolResultsByCallId.set(toolCallId, previous);
                }
              }

              rows.push(
                <div
                  key={index}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={delayStyle}
                >
                  {role === "system" && (
                    <SystemMessage
                      content={normalizedContent}
                      meta={contentMeta}
                      flags={flags}
                      rawMessage={rawMessage}
                    />
                  )}

                  {role === "user" && (
                    <UserMessage
                      content={normalizedContent}
                      meta={contentMeta}
                      flags={flags}
                      rawMessage={rawMessage}
                    />
                  )}

                  {role === "assistant" && (
                    <AssistantMessage
                      content={normalizedContent}
                      meta={contentMeta}
                      toolCalls={toolCalls}
                      toolResultsByCallId={toolResultsByCallId}
                      flags={flags}
                      rawMessage={rawMessage}
                    />
                  )}

                  {role === "tool" && !consumedToolIndexes.has(index) && (
                    <ToolResponse
                      content={normalizedContent}
                      meta={contentMeta}
                      toolName={
                        msg.tool_call_id
                          ? toolNameById.get(msg.tool_call_id)
                          : undefined
                      }
                      flags={flags}
                      rawMessage={rawMessage}
                    />
                  )}

                  {role !== "system" &&
                    role !== "user" &&
                    role !== "assistant" &&
                    role !== "tool" && (
                      <ToolResponse
                        content={normalizedContent}
                        meta={contentMeta}
                        toolName={msg.name ?? role}
                        flags={flags}
                        rawMessage={rawMessage}
                      />
                    )}
                </div>,
              );
            }

            return rows;
          })()}
        </div>
      </div>
    </div>
  );
}
