import type { LucideIcon } from "lucide-react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
  className = "",
  contentClassName = "",
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-lg border overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors duration-150"
      >
        {Icon && (
          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
        <span
          className={`transition-transform duration-200 ease-in-out ${
            isOpen ? "rotate-0" : "-rotate-90"
          }`}
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </span>
      </button>
      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[2000px]" : "max-h-0"
        } overflow-hidden`}
      >
        <div className={`p-4 ${contentClassName}`}>{children}</div>
      </div>
    </div>
  );
}
