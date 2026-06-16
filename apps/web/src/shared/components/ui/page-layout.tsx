import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface PageLayoutProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  showFilters?: boolean;
  filters?: ReactNode;
  buttons?: ReactNode;
  variant?: "default" | "flex";
  children?: ReactNode;
}

export function PageLayout({
  title,
  subtitle,
  icon: Icon,
  showFilters = true,
  filters,
  buttons,
  variant = "default",
  children,
}: PageLayoutProps) {
  const containerClass = variant === "flex" ? "flex flex-col gap-3" : "";
  const hasRightContent = (showFilters && filters) || buttons;
  const hasHeader = Boolean(title) || Boolean(Icon) || hasRightContent;

  return (
    <div className={`min-w-0 px-4 ${containerClass}`}>
      {hasHeader && (
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            {(title || Icon) && (
              <h1 className="text-2xl font-bold flex items-center gap-2 pt-2 pb-2">
                {Icon && <Icon className="h-8 w-8" />}
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {hasRightContent && (
            <div className="flex flex-col items-end gap-2">
              {showFilters && filters && filters}
              {buttons && (
                <div className="flex items-center gap-2">{buttons}</div>
              )}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
