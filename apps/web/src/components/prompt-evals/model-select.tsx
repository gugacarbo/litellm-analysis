import { ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/utils";

interface ModelSelectProps {
  models: Array<{ modelName: string; litellmParams: Record<string, unknown> }>;
  value: string;
  onChange: (modelName: string) => void;
  placeholder?: string;
}

export function ModelSelect({
  models,
  value,
  onChange,
  placeholder = "Selecione um modelo...",
}: ModelSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = models.filter((m) =>
    m.modelName.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm",
          "hover:bg-muted/50 cursor-pointer",
        )}
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow-lg">
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar modelo..."
              className="flex h-10 w-full bg-transparent py-2 pl-2 text-sm outline-none"
            />
          </div>
          <div className="max-h-60 overflow-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Nenhum modelo encontrado
              </p>
            ) : (
              filtered.map((m) => (
                <button
                  key={m.modelName}
                  type="button"
                  onClick={() => {
                    onChange(m.modelName);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex w-full items-center px-3 py-2 text-sm hover:bg-muted/50",
                    m.modelName === value && "bg-muted",
                  )}
                >
                  <span className="font-mono">{m.modelName}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
