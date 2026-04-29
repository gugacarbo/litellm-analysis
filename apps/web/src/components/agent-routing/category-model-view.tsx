import type { CategoryDefinition } from "@lite-llm/api-contracts/agent-routing";
import { Badge } from "../ui/badge";
import type { ConfigInfo } from "./agent-routing-types";
import type { EntityItem } from "./model-station-card";
import { ModelStationCard } from "./model-station-card";

export type CategoryModelViewProps = {
  loading: boolean;
  categories: CategoryDefinition[];
  getCategoryConfigInfo: (key: string) => ConfigInfo | null;
  onOpenCategoryConfig: (key: string) => void;
};

type CategoryModelGroup = {
  modelName: string;
  categories: EntityItem[];
  totalFallbacks: number;
};

export function CategoryModelView({
  loading,
  categories,
  getCategoryConfigInfo,
  onOpenCategoryConfig,
}: CategoryModelViewProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const rows = categories.map((category) => {
    const configInfo = getCategoryConfigInfo(category.key);
    return {
      category,
      configInfo,
      hasPrimaryModel: Boolean(configInfo && configInfo.model !== "Unassigned"),
    };
  });

  const modelGroupsMap = new Map<string, CategoryModelGroup>();

  for (const row of rows) {
    if (!row.hasPrimaryModel || !row.configInfo) continue;
    const modelName = row.configInfo.model;

    const existing = modelGroupsMap.get(modelName);
    if (existing) {
      existing.categories.push({
        key: row.category.key,
        name: row.category.name,
      });
      existing.totalFallbacks += row.configInfo.fallbackCount;
    } else {
      modelGroupsMap.set(modelName, {
        modelName,
        categories: [{ key: row.category.key, name: row.category.name }],
        totalFallbacks: row.configInfo.fallbackCount,
      });
    }
  }

  const modelGroups = Array.from(modelGroupsMap.values()).sort(
    (a, b) => b.categories.length - a.categories.length,
  );

  if (modelGroups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="font-medium">No models configured</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign models to categories to see them here.
        </p>
      </div>
    );
  }

  const totalCategories = modelGroups.reduce(
    (sum, g) => sum + g.categories.length,
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Model Stations</h3>
          <p className="text-xs text-muted-foreground">
            {modelGroups.length} model{modelGroups.length === 1 ? "" : "s"}{" "}
            serving {totalCategories} categor
            {totalCategories === 1 ? "y" : "ies"}
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          {modelGroups.length} stations
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modelGroups.map((group) => (
          <ModelStationCard
            key={group.modelName}
            modelName={group.modelName}
            entities={group.categories}
            totalFallbacks={group.totalFallbacks}
            onOpenEntityConfig={onOpenCategoryConfig}
          />
        ))}
      </div>
    </div>
  );
}
