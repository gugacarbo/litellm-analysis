import { jsx as _jsx } from "react/jsx-runtime";
import { EntityFocusCard } from "./entity-focus-card";
export function CategoryFocusView({
  loading,
  categories,
  models,
  getCategoryConfigInfo,
  onOpenCategoryConfig,
  onQuickModelChange,
}) {
  if (loading) {
    return _jsx("div", {
      className: "space-y-4",
      children: _jsx("div", {
        className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        children: Array.from({ length: 6 }).map((_, i) =>
          _jsx(
            "div",
            { className: "h-32 animate-pulse rounded-xl bg-muted" },
            i,
          ),
        ),
      }),
    });
  }
  return _jsx("div", {
    className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    children: categories.map((category) =>
      _jsx(
        EntityFocusCard,
        {
          entityKey: category.key,
          name: category.name,
          description: category.description,
          configInfo: getCategoryConfigInfo(category.key),
          models: models,
          onOpenConfig: onOpenCategoryConfig,
          onQuickModelChange: onQuickModelChange,
        },
        category.key,
      ),
    ),
  });
}
