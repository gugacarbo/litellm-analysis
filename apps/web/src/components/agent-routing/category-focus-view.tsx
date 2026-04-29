import type { CategoryDefinition } from "@lite-llm/api-contracts/agent-routing";
import type { ConfigInfo } from "./agent-routing-types";
import { EntityFocusCard } from "./entity-focus-card";

export type CategoryFocusViewProps = {
  loading: boolean;
  categories: CategoryDefinition[];
  models: string[];
  getCategoryConfigInfo: (key: string) => ConfigInfo | null;
  onOpenCategoryConfig: (key: string) => void;
  onQuickModelChange: (categoryKey: string, model: string) => void;
};

export function CategoryFocusView({
  loading,
  categories,
  models,
  getCategoryConfigInfo,
  onOpenCategoryConfig,
  onQuickModelChange,
}: CategoryFocusViewProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {categories.map((category) => (
        <EntityFocusCard
          key={category.key}
          entityKey={category.key}
          name={category.name}
          description={category.description}
          configInfo={getCategoryConfigInfo(category.key)}
          models={models}
          onOpenConfig={onOpenCategoryConfig}
          onQuickModelChange={onQuickModelChange}
        />
      ))}
    </div>
  );
}
