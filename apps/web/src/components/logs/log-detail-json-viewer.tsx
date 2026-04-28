import { ChevronDown, ChevronRight } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

interface JsonViewerProps {
  data: Record<string, unknown> | unknown[] | null | undefined;
  defaultOpen?: boolean;
  maxHeight?: string;
  className?: string;
}

interface JsonNodeProps {
  defaultOpen?: boolean;
  indentLevel?: number;
}

function JsonValue({
  defaultOpen,
  indentLevel = 0,
  value,
}: JsonNodeProps & { value: unknown }): ReactNode {
  if (value === null) {
    return <span className="text-muted-foreground italic">null</span>;
  }

  if (value === undefined) {
    return <span className="text-muted-foreground italic">undefined</span>;
  }

  if (typeof value === "string") {
    return (
      <span className="text-emerald-600 dark:text-emerald-400">"{value}"</span>
    );
  }

  if (typeof value === "number") {
    return <span className="text-amber-600 dark:text-amber-400">{value}</span>;
  }

  if (typeof value === "boolean") {
    return (
      <span className="text-purple-600 dark:text-purple-400">
        {String(value)}
      </span>
    );
  }

  if (Array.isArray(value)) {
    return (
      <JsonArray
        defaultOpen={defaultOpen}
        indentLevel={indentLevel}
        value={value}
      />
    );
  }

  if (typeof value === "object") {
    return (
      <JsonObject
        defaultOpen={defaultOpen}
        indentLevel={indentLevel}
        value={value as Record<string, unknown>}
      />
    );
  }

  return <span className="text-red-500">"{String(value)}"</span>;
}

function JsonObject({
  defaultOpen,
  indentLevel = 0,
  value,
}: JsonNodeProps & { value: Record<string, unknown> }): ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const keys = Object.keys(value);
  const isEmpty = keys.length === 0;

  useEffect(() => {
    setIsOpen(defaultOpen ?? false);
  }, [defaultOpen]);

  if (isEmpty) {
    return <span className="text-muted-foreground">{"{}"}</span>;
  }

  const indent = "  ".repeat(indentLevel);

  return (
    <span className="inline">
      <button
        className="inline-flex items-center gap-1 -ml-0.5 cursor-pointer rounded px-0.5 hover:bg-muted/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
        <span className="text-muted-foreground">{"{"}</span>
        {!isOpen && (
          <span className="text-muted-foreground/60">
            <span className="text-muted-foreground">{"}"}</span>
            <span className="ml-1 text-xs">
              ({keys.length} {keys.length === 1 ? "key" : "keys"})
            </span>
          </span>
        )}
      </button>
      {isOpen && (
        <>
          <br />
          {keys.map((key, index) => (
            <span key={key}>
              {indent}
              <span className="text-blue-600 dark:text-blue-400">"{key}"</span>
              <span className="text-muted-foreground">: </span>
              <JsonValue
                defaultOpen={defaultOpen}
                indentLevel={indentLevel + 1}
                value={value[key]}
              />
              {index < keys.length - 1 && (
                <span className="text-muted-foreground">,</span>
              )}
              <br />
            </span>
          ))}
          {indent}
          <span className="text-muted-foreground">{"}"}</span>
        </>
      )}
    </span>
  );
}

function JsonArray({
  defaultOpen,
  indentLevel = 0,
  value,
}: JsonNodeProps & { value: unknown[] }): ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const isEmpty = value.length === 0;

  useEffect(() => {
    setIsOpen(defaultOpen ?? false);
  }, [defaultOpen]);

  if (isEmpty) {
    return <span className="text-muted-foreground">[]</span>;
  }

  const indent = "  ".repeat(indentLevel);

  return (
    <span className="inline">
      <button
        className="inline-flex items-center gap-1 -ml-0.5 cursor-pointer rounded px-0.5 hover:bg-muted/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
        <span className="text-muted-foreground">[</span>
        {!isOpen && (
          <span className="text-muted-foreground/60">
            <span className="text-muted-foreground">]</span>
            <span className="ml-1 text-xs">
              ({value.length} {value.length === 1 ? "item" : "items"})
            </span>
          </span>
        )}
      </button>
      {isOpen && (
        <>
          <br />
          {value.map((item, index) => (
            <span key={index}>
              {indent}
              <JsonValue
                defaultOpen={defaultOpen}
                indentLevel={indentLevel + 1}
                value={item}
              />
              {index < value.length - 1 && (
                <span className="text-muted-foreground">,</span>
              )}
              <br />
            </span>
          ))}
          {indent}
          <span className="text-muted-foreground">]</span>
        </>
      )}
    </span>
  );
}

export function JsonViewer({
  className = "",
  data,
  defaultOpen = false,
  maxHeight = "max-h-96",
}: JsonViewerProps) {
  if (data === null || data === undefined) {
    return (
      <div
        className={`rounded-md bg-muted/50 p-3 font-mono text-xs italic text-muted-foreground ${className}`}
      >
        No data available
      </div>
    );
  }

  return (
    <div
      className={`rounded-md bg-muted/50 p-3 font-mono text-xs overflow-y-auto ${maxHeight} ${className}`}
    >
      <JsonValue value={data} defaultOpen={defaultOpen} />
    </div>
  );
}
