import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { EntityRoutingCard } from "./entity-routing-card";

export type EntityRoutingTabProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  totalCount: number;
  configuredCount: number;
  totalFallbacks: number;
  focusContent: ReactNode;
};

export function EntityRoutingTab({
  icon,
  title,
  description,
  totalCount,
  configuredCount,
  totalFallbacks,
  focusContent,
}: EntityRoutingTabProps) {
  return (
    <EntityRoutingCard
      icon={icon}
      title={title}
      description={description}
      totalCount={totalCount}
      configuredCount={configuredCount}
      totalFallbacks={totalFallbacks}
    >
      {focusContent}
    </EntityRoutingCard>
  );
}
