import type { CategoryEntry } from "@lite-llm/api-contracts/category";
import { Folder } from "lucide-react";
import { EntityRoutingCard } from "./entity-routing-card";

type AgentRoutingCategoriesTabProps = {
  loading: boolean;
  categories: Record<string, CategoryEntry>;
};

export function AgentRoutingCategoriesTab({
  loading,
  categories,
}: AgentRoutingCategoriesTabProps) {
  const safeCategories = categories ?? {};
  const entries = Object.entries(safeCategories);
  const configuredCount = entries.filter(
    ([, cat]) => cat.model !== "" && cat.model !== undefined,
  ).length;

  return (
    <EntityRoutingCard
      icon={Folder}
      title="Categories"
      totalCount={entries.length}
      configuredCount={configuredCount}
    >
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No categories configured.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {entries.map(([key, cat]) => (
            <div
              key={key}
              className="rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{key}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {cat.description || cat.model}
              </p>
            </div>
          ))}
        </div>
      )}
    </EntityRoutingCard>
  );
}
