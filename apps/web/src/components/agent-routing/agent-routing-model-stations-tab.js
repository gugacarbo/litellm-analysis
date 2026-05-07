import { Layers } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TooltipProvider } from "../ui/tooltip";
import { CombinedModelView } from "./combined-model-view";
export function AgentRoutingModelStationsTab({
  loading,
  agents,
  categories,
  onOpenAgentConfig,
  onOpenCategoryConfig,
  getAgentConfigInfo,
  getCategoryConfigInfo,
}) {
  // Calculate combined stats
  const configuredAgentsCount = agents.filter((agent) => {
    const config = getAgentConfigInfo(agent.key);
    return Boolean(config && config.model !== "Unassigned");
  }).length;
  const configuredCategoriesCount = categories.filter((category) => {
    const config = getCategoryConfigInfo(category.key);
    return Boolean(config && config.model !== "Unassigned");
  }).length;
  const totalConfiguredCount =
    configuredAgentsCount + configuredCategoriesCount;
  const totalEntities = agents.length + categories.length;
  const totalFallbacks =
    agents.reduce((sum, agent) => {
      const config = getAgentConfigInfo(agent.key);
      return sum + (config?.fallbackCount ?? 0);
    }, 0) +
    categories.reduce((sum, category) => {
      const config = getCategoryConfigInfo(category.key);
      return sum + (config?.fallbackCount ?? 0);
    }, 0);
  return _jsx(TooltipProvider, {
    delayDuration: 300,
    children: _jsx("div", {
      className: "space-y-4",
      children: _jsxs(Card, {
        children: [
          _jsx(CardHeader, {
            children: _jsxs("div", {
              className: "flex items-center flex-1 justify-between gap-4",
              children: [
                _jsxs(CardTitle, {
                  className: "flex items-center gap-2",
                  children: [
                    _jsx(Layers, { className: "size-5" }),
                    "Model Stations",
                  ],
                }),
                _jsxs("div", {
                  className:
                    "flex items-center gap-4 text-sm text-muted-foreground",
                  children: [
                    _jsxs("span", {
                      children: [
                        _jsx("span", {
                          className: "font-medium text-foreground",
                          children: totalConfiguredCount,
                        }),
                        "/",
                        totalEntities,
                        " configured",
                      ],
                    }),
                    totalFallbacks > 0 &&
                      _jsxs("span", {
                        children: [
                          _jsx("span", {
                            className: "font-medium text-foreground",
                            children: totalFallbacks,
                          }),
                          " ",
                          "fallback",
                          totalFallbacks === 1 ? "" : "s",
                        ],
                      }),
                  ],
                }),
              ],
            }),
          }),
          _jsx(CardContent, {
            children: _jsx(CombinedModelView, {
              loading: loading,
              agents: agents,
              categories: categories,
              getAgentConfigInfo: getAgentConfigInfo,
              getCategoryConfigInfo: getCategoryConfigInfo,
              onOpenAgentConfig: onOpenAgentConfig,
              onOpenCategoryConfig: onOpenCategoryConfig,
            }),
          }),
        ],
      }),
    }),
  });
}
