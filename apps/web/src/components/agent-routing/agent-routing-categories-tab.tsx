import type { CategoryDefinition } from "@lite-llm/api-contracts/agent-routing";
import { Database } from "lucide-react";
import type { ConfigInfo } from "./agent-routing-types";
import { CategoryFocusView } from "./category-focus-view";
import { EntityRoutingCard } from "./entity-routing-card";

type AgentRoutingCategoriesTabProps = {
  loading: boolean;
  categories: CategoryDefinition[];
  models: string[];
  onOpenCategoryConfig: (key: string) => void;
  onQuickModelChange: (categoryKey: string, model: string) => void;
  getCategoryConfigInfo: (key: string) => ConfigInfo | null;
};

export function AgentRoutingCategoriesTab({
  loading,
  categories,
  models,
  onOpenCategoryConfig,
  onQuickModelChange,
  getCategoryConfigInfo,
}: AgentRoutingCategoriesTabProps) {
  const configuredCategoriesCount = categories.filter((category) => {
    const config = getCategoryConfigInfo(category.key);
    return Boolean(config && config.model !== "Unassigned");
  }).length;

  const totalFallbacks = categories.reduce((sum, category) => {
    const config = getCategoryConfigInfo(category.key);
    return sum + (config?.fallbackCount ?? 0);
  }, 0);

  return (
    <EntityRoutingCard
      icon={Database}
      title="Categories"
      description="Category-level model distribution and execution defaults."
      totalCount={categories.length}
      configuredCount={configuredCategoriesCount}
      totalFallbacks={totalFallbacks}
    >
      <CategoryFocusView
        loading={loading}
        categories={categories}
        models={models}
        getCategoryConfigInfo={getCategoryConfigInfo}
        onOpenCategoryConfig={onOpenCategoryConfig}
        onQuickModelChange={onQuickModelChange}
      />
    </EntityRoutingCard>
  );
}
