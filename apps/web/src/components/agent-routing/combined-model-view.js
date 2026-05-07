import { Layers } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatCompactNumber, formatCurrency } from "@/lib/format";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { ModelStationCard } from "./model-station-card";
import { useModelStationsData } from "./model-stations-data-hook";
export function CombinedModelView({
  loading,
  agents,
  categories,
  getAgentConfigInfo,
  getCategoryConfigInfo,
  onOpenAgentConfig,
  onOpenCategoryConfig,
}) {
  const { statsMap, statsLoading } = useModelStationsData();
  if (loading) {
    return _jsx("div", {
      className: "space-y-4",
      children: _jsx("div", {
        className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
        children: Array.from({ length: 6 }).map((_, i) =>
          _jsx(
            "div",
            { className: "h-64 animate-pulse rounded-xl bg-muted" },
            i,
          ),
        ),
      }),
    });
  }
  const modelGroupsMap = new Map();
  // Process agents
  for (const agent of agents) {
    const configInfo = getAgentConfigInfo(agent.key);
    if (!configInfo || configInfo.model === "Unassigned") continue;
    const modelName = configInfo.model;
    const existing = modelGroupsMap.get(modelName);
    if (existing) {
      existing.agents.push({
        key: agent.key,
        name: agent.name,
        icon: agent.icon,
      });
      existing.totalFallbacks += configInfo.fallbackCount;
    } else {
      modelGroupsMap.set(modelName, {
        modelName,
        agents: [{ key: agent.key, name: agent.name, icon: agent.icon }],
        categories: [],
        totalFallbacks: configInfo.fallbackCount,
        stats: statsMap.get(modelName),
      });
    }
  }
  // Process categories
  for (const category of categories) {
    const configInfo = getCategoryConfigInfo(category.key);
    if (!configInfo || configInfo.model === "Unassigned") continue;
    const modelName = configInfo.model;
    const existing = modelGroupsMap.get(modelName);
    if (existing) {
      existing.categories.push({
        key: category.key,
        name: category.name,
      });
      existing.totalFallbacks += configInfo.fallbackCount;
    } else {
      modelGroupsMap.set(modelName, {
        modelName,
        agents: [],
        categories: [{ key: category.key, name: category.name }],
        totalFallbacks: configInfo.fallbackCount,
        stats: statsMap.get(modelName),
      });
    }
  }
  const modelGroups = Array.from(modelGroupsMap.values()).sort(
    (a, b) =>
      b.agents.length +
      b.categories.length -
      (a.agents.length + a.categories.length),
  );
  if (modelGroups.length === 0) {
    return _jsxs("div", {
      className:
        "rounded-xl border border-dashed border-border p-8 text-center",
      children: [
        _jsx("div", {
          className: "mb-3 flex justify-center",
          children: _jsx("div", {
            className: "rounded-full bg-muted p-4",
            children: _jsx(Layers, {
              className: "h-8 w-8 text-muted-foreground",
            }),
          }),
        }),
        _jsx("p", {
          className: "font-medium",
          children: "No models configured",
        }),
        _jsx("p", {
          className: "mt-1 text-sm text-muted-foreground",
          children: "Assign models to agents or categories to see them here.",
        }),
      ],
    });
  }
  const totalAgents = modelGroups.reduce((sum, g) => sum + g.agents.length, 0);
  const totalCategories = modelGroups.reduce(
    (sum, g) => sum + g.categories.length,
    0,
  );
  // Aggregate stats across all models
  const totalRequests = modelGroups.reduce(
    (sum, g) => sum + (g.stats?.request_count ?? 0),
    0,
  );
  const totalSpend = modelGroups.reduce(
    (sum, g) => sum + (g.stats?.total_spend ?? 0),
    0,
  );
  const totalTokens = modelGroups.reduce(
    (sum, g) => sum + (g.stats?.total_tokens ?? 0),
    0,
  );
  const totalErrors = modelGroups.reduce(
    (sum, g) => sum + (g.stats?.error_count ?? 0),
    0,
  );
  return _jsxs("div", {
    className: "space-y-4",
    children: [
      _jsx("div", {
        className: "rounded-lg border bg-card p-4",
        children: _jsxs("div", {
          className: "flex flex-wrap items-center justify-between gap-4",
          children: [
            _jsxs("div", {
              children: [
                _jsx("h3", {
                  className: "text-sm font-semibold",
                  children: "Model Stations",
                }),
                _jsxs("p", {
                  className: "text-xs text-muted-foreground",
                  children: [
                    modelGroups.length,
                    " model",
                    modelGroups.length === 1 ? "" : "s",
                    " ",
                    "serving ",
                    totalAgents,
                    " agent",
                    totalAgents === 1 ? "" : "s",
                    " and",
                    " ",
                    totalCategories,
                    " categor",
                    totalCategories === 1 ? "y" : "ies",
                  ],
                }),
              ],
            }),
            !statsLoading &&
              totalRequests > 0 &&
              _jsxs("div", {
                className: "flex flex-wrap gap-3",
                children: [
                  _jsx(AggregateStat, {
                    label: "Requests",
                    value: formatCompactNumber(totalRequests),
                    subValue: `${modelGroups.length} models`,
                  }),
                  _jsx(AggregateStat, {
                    label: "Spend",
                    value: formatCurrency(totalSpend),
                    subValue: "total",
                  }),
                  _jsx(AggregateStat, {
                    label: "Tokens",
                    value: formatCompactNumber(totalTokens),
                    subValue: "total",
                  }),
                  totalErrors > 0 &&
                    _jsx(AggregateStat, {
                      label: "Errors",
                      value: formatCompactNumber(totalErrors),
                      subValue: "total",
                      variant: "warning",
                    }),
                ],
              }),
            _jsxs(Badge, {
              variant: "outline",
              className: "font-mono text-xs",
              children: [modelGroups.length, " stations"],
            }),
          ],
        }),
      }),
      _jsx("div", {
        className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
        children: modelGroups.map((group) =>
          _jsx(
            ModelStationCard,
            {
              modelName: group.modelName,
              entities: [
                ...group.agents.map((a) => ({
                  key: a.key,
                  name: a.name,
                  icon: a.icon,
                })),
                ...group.categories.map((c) => ({ key: c.key, name: c.name })),
              ],
              totalFallbacks: group.totalFallbacks,
              stats: group.stats,
              onOpenEntityConfig: (key) => {
                const isAgent = group.agents.some((a) => a.key === key);
                if (isAgent) {
                  onOpenAgentConfig(key);
                } else {
                  onOpenCategoryConfig(key);
                }
              },
            },
            group.modelName,
          ),
        ),
      }),
    ],
  });
}
function AggregateStat({ label, value, subValue, variant = "default" }) {
  return _jsxs("div", {
    className: "text-center",
    children: [
      _jsx("div", {
        className: cn(
          "text-lg font-bold",
          variant === "warning" && "text-amber-600",
        ),
        children: value,
      }),
      _jsxs("div", {
        className: "text-xs text-muted-foreground",
        children: [label, " (", subValue, ")"],
      }),
    ],
  });
}
