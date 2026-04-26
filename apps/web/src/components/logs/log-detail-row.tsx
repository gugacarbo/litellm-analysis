import type { ComponentType, ReactNode } from "react";
import { cn } from "../../lib/utils";

type LogDetailRowProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
  mono?: boolean;
};

export function LogDetailRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: LogDetailRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 px-3 py-2.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="text-xs uppercase tracking-wide">{label}</div>
      </div>
      <div
        className={cn(
          "min-w-0 max-w-[62%] text-right text-sm font-medium break-words",
          mono ? "font-mono text-xs break-all" : "",
        )}
      >
        {value}
      </div>
    </div>
  );
}
