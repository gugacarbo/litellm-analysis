import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { PageLayoutHeader } from "./page-layout-header";

export interface PageLayoutProps {
  title: string;
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
  return (
    <div
      className={`p-2 md:pr-3 ${variant === "flex" ? "flex flex-col gap-6" : ""} `}
    >
      <PageLayoutHeader
        title={title}
        subtitle={subtitle}
        icon={Icon}
        showFilters={showFilters}
        filters={filters}
        buttons={buttons}
      />
      {children}
    </div>
  );
}
