import type { LucideIcon } from "lucide-react";

export interface PageLayoutHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  showFilters?: boolean;
  filters?: React.ReactNode;
  buttons?: React.ReactNode;
  variant?: "default" | "flex";
  children?: React.ReactNode;
}

function PageLayoutHeader({
  title,
  subtitle,
  icon: Icon,
  showFilters,
  filters,
  buttons,
}: PageLayoutHeaderProps) {
  const hasRightContent = (showFilters && filters) || buttons;

  return (
    <div className="flex items-start justify-between gap-4 flex-wrap py-4">
      <div className="flex-1 min-w-0 gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2 ">
          {Icon && <Icon className="h-8 w-8" />}
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        )}
      </div>
      {hasRightContent && (
        <div className="flex flex-col items-end gap-2 h-full justify-between">
          {showFilters && filters && filters}
          {buttons && <div className="flex items-center gap-2">{buttons}</div>}
        </div>
      )}
    </div>
  );
}

export { PageLayoutHeader };
