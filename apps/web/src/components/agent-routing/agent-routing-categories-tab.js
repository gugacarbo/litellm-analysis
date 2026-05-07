import { Database } from "lucide-react";
import { jsx as _jsx } from "react/jsx-runtime";
import { CategoryFocusView } from "./category-focus-view";
import { EntityRoutingCard } from "./entity-routing-card";
export function AgentRoutingCategoriesTab({
  loading,
  categories,
  models,
  onOpenCategoryConfig,
  onQuickModelChange,
  getCategoryConfigInfo,
}) {
  const configuredCategoriesCount = categories.filter((category) => {
    const config = getCategoryConfigInfo(category.key);
    return Boolean(config && config.model !== "Unassigned");
  }).length;
  const totalFallbacks = categories.reduce((sum, category) => {
    const config = getCategoryConfigInfo(category.key);
    return sum + (config?.fallbackCount ?? 0);
  }, 0);
  return _jsx(EntityRoutingCard, {
    icon: Database,
    title: "Categories",
    description: "Category-level model distribution and execution defaults.",
    totalCount: categories.length,
    configuredCount: configuredCategoriesCount,
    totalFallbacks: totalFallbacks,
    children: _jsx(CategoryFocusView, {
      loading: loading,
      categories: categories,
      models: models,
      getCategoryConfigInfo: getCategoryConfigInfo,
      onOpenCategoryConfig: onOpenCategoryConfig,
      onQuickModelChange: onQuickModelChange,
    }),
  });
}
