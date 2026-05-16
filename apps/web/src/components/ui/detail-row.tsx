import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Copy } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "../../lib/utils";

interface DetailRowProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  mono?: boolean;
  copyValue?: string;
  className?: string;
}

export function DetailRow({
  label,
  value,
  icon: Icon,
  mono = false,
  copyValue,
  className,
}: DetailRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (copyValue) {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={cn("grid grid-cols-[120px_1fr] gap-3 px-3 py-2.5", className)}
    >
      <dt className="flex items-center gap-2 text-xs text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        {label}
      </dt>
      <dd
        className={cn(
          "text-sm font-medium break-words flex items-center gap-2",
          mono && "font-mono text-xs",
        )}
      >
        <span className="flex-1">{value}</span>
        {copyValue && (
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 text-muted-foreground/50 hover:text-foreground transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </dd>
    </div>
  );
}

interface InfoSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function InfoSection({ title, children, className }: InfoSectionProps) {
  return (
    <section className={cn("overflow-hidden rounded-lg border", className)}>
      <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <dl className="divide-y divide-border">{children}</dl>
    </section>
  );
}
