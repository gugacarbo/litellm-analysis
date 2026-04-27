import { Palette, RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";
import type { CategoryDefinition } from "../../types/agent-routing";
import { Badge } from "../badge";
import { Button } from "../button";
import { Skeleton } from "../skeleton";

type ConfigInfo = {
  model: string;
  description?: string;
  fallbackCount: number;
};

type CategoriesTableProps = {
  loading: boolean;
  saving: boolean;
  categories: CategoryDefinition[];
  getCategoryConfigInfo: (key: string) => ConfigInfo | null;
  onOpenCategoryConfig: (key: string) => void;
  onDeleteCategoryConfig: (key: string) => void;
};

export function CategoriesTable({
  loading,
  saving,
  categories,
  getCategoryConfigInfo,
  onOpenCategoryConfig,
  onDeleteCategoryConfig,
}: CategoriesTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No categories available.
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

  const configuredCount = rows.filter((row) => row.hasPrimaryModel).length;
  const unconfiguredCount = rows.length - configuredCount;
  const totalFallbacks = rows.reduce(
    (sum, row) => sum + (row.configInfo?.fallbackCount || 0),
    0,
  );

  const modelGroupsMap = new Map<string, CategoryDefinition[]>();
  for (const row of rows) {
    if (!row.hasPrimaryModel || !row.configInfo) continue;
    const existing = modelGroupsMap.get(row.configInfo.model);
    if (existing) {
      existing.push(row.category);
    } else {
      modelGroupsMap.set(row.configInfo.model, [row.category]);
    }
  }

  const modelGroups = Array.from(modelGroupsMap.entries()).sort((a, b) => {
    if (b[1].length !== a[1].length) {
      return b[1].length - a[1].length;
    }
    return a[0].localeCompare(b[0]);
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="text-xs text-muted-foreground">Configured Categories</p>
          <p className="text-2xl font-semibold">{configuredCount}</p>
          <p className="text-xs text-muted-foreground">
            of {categories.length} total
          </p>
        </div>
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
          <p className="text-xs text-muted-foreground">Active Models</p>
          <p className="text-2xl font-semibold">{modelGroups.length}</p>
          <p className="text-xs text-muted-foreground">
            distinct primary models
          </p>
        </div>
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
          <p className="text-xs text-muted-foreground">Fallback Models</p>
          <p className="text-2xl font-semibold">{totalFallbacks}</p>
          <p className="text-xs text-muted-foreground">
            configured across categories
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="text-xs text-muted-foreground">Needs Assignment</p>
          <p className="text-2xl font-semibold">{unconfiguredCount}</p>
          <p className="text-xs text-muted-foreground">
            without a primary model
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-gradient-to-br from-muted/35 via-background to-background p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Model Focus</p>
            <p className="text-xs text-muted-foreground">
              Which categories are currently sharing each primary model.
            </p>
          </div>
          <Badge variant="outline">
            {modelGroups.length} model{modelGroups.length === 1 ? "" : "s"} in
            use
          </Badge>
        </div>

        {modelGroups.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No primary model assigned yet.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {modelGroups.map(([modelName, modelCategories]) => (
              <div key={modelName} className="rounded-lg border bg-card/80 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs font-medium break-all">
                    {modelName}
                  </p>
                  <Badge variant="secondary">
                    {modelCategories.length} categor
                    {modelCategories.length === 1 ? "y" : "ies"}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {modelCategories.map((category) => (
                    <Badge
                      key={category.key}
                      variant="outline"
                      className="h-auto py-1"
                    >
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {rows.map(({ category, configInfo, hasPrimaryModel }) => (
          <div
            key={category.key}
            className={cn(
              "rounded-xl border p-3",
              hasPrimaryModel
                ? "bg-card"
                : "border-dashed border-border/80 bg-muted/15",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="font-medium">{category.name}</p>
                <p className="text-xs text-muted-foreground">
                  {configInfo?.description || category.description}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onOpenCategoryConfig(category.key)}
                  title="Edit category configuration"
                >
                  <Palette className="h-4 w-4" />
                </Button>
                {configInfo ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDeleteCategoryConfig(category.key)}
                    title="Reset to default"
                    disabled={saving}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Reset</span>
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {configInfo ? (
                <Badge
                  variant="outline"
                  className="h-auto max-w-full py-1 font-mono text-xs"
                >
                  {configInfo.model}
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="bg-muted text-muted-foreground"
                >
                  Unconfigured
                </Badge>
              )}
              {configInfo?.fallbackCount ? (
                <Badge variant="secondary">
                  +{configInfo.fallbackCount} fallback
                  {configInfo.fallbackCount === 1 ? "" : "s"}
                </Badge>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
