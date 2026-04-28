import { Inbox } from "lucide-react";
import type { ElementType } from "react";

type EmptyStateProps = {
  icon?: ElementType;
  title?: string;
  description?: string;
  className?: string;
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center text-muted-foreground ${className ?? "py-12"}`}
    >
      <Icon className="mb-3 h-10 w-10 stroke-1 opacity-40" />
      {title && <p className="text-sm font-medium">{title}</p>}
      {description && <p className="mt-1 max-w-xs text-xs">{description}</p>}
    </div>
  );
}
