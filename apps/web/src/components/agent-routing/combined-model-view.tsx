import type {
  AgentDefinition,
  CategoryDefinition,
} from "@lite-llm/api-contracts/agent-routing";
import { formatCompactNumber, formatCurrency } from "@/lib/format";
import { Layers } from "lucide-react";
import type { ModelStatistics } from "../../lib/api-client/analytics";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { ModelStationCard } from "./model-station-card";
import { useModelStationsData } from "./model-stations-data-hook";

export type CombinedModelViewProps = {
  loading: boolean;
  agents: AgentDefinition[];
  categories: CategoryDefinition[];
  getAgentConfigInfo: (
    key: string,
  ) => { model: string; fallbackCount: number } | null;
  getCategoryConfigInfo: (
    key: string,
  ) => { model: string; fallbackCount: number } | null;
  onOpenAgentConfig: (key: string) => void;
  onOpenCategoryConfig: (key: string) => void;
};

type CombinedModelGroup = {
  modelName: string;
  agents: { key: string; name: string; icon: string }[];
  categories: { key: string; name: string }[];
  totalFallbacks: number;
  stats?: ModelStatistics;
};

export function CombinedModelView({
  loading,
  agents,
  categories,
  getAgentConfigInfo,
  getCategoryConfigInfo,
  onOpenAgentConfig,
  onOpenCategoryConfig,
}: CombinedModelViewProps) {
  const { statsMap, statsLoading } = useModelStationsData();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const modelGroupsMap = new Map<string, CombinedModelGroup>();

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
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <div className="mb-3 flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <Layers className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <p className="font-medium">No models configured</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign models to agents or categories to see them here.
        </p>
      </div>
    );
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

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold">Model Stations</h3>
            <p className="text-xs text-muted-foreground">
              {modelGroups.length} model{modelGroups.length === 1 ? "" : "s"}{" "}
              serving {totalAgents} agent{totalAgents === 1 ? "" : "s"} and{" "}
              {totalCategories} categor{totalCategories === 1 ? "y" : "ies"}
            </p>
          </div>

          {/* Aggregate stats */}
          {!statsLoading && totalRequests > 0 && (
            <div className="flex flex-wrap gap-3">
              <AggregateStat
                label="Requests"
                value={formatCompactNumber(totalRequests)}
                subValue={`${modelGroups.length} models`}
              />
              <AggregateStat
                label="Spend"
                value={formatCurrency(totalSpend)}
                subValue="total"
              />
              <AggregateStat
                label="Tokens"
                value={formatCompactNumber(totalTokens)}
                subValue="total"
              />
              {totalErrors > 0 && (
                <AggregateStat
                  label="Errors"
                  value={formatCompactNumber(totalErrors)}
                  subValue="total"
                  variant="warning"
                />
              )}
            </div>
          )}

          <Badge variant="outline" className="font-mono text-xs">
            {modelGroups.length} stations
          </Badge>
        </div>
      </div>

      {/* Model cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modelGroups.map((group) => (
          <ModelStationCard
            key={group.modelName}
            modelName={group.modelName}
            entities={[
              ...group.agents.map((a) => ({
                key: a.key,
                name: a.name,
                icon: a.icon,
              })),
              ...group.categories.map((c) => ({ key: c.key, name: c.name })),
            ]}
            totalFallbacks={group.totalFallbacks}
            stats={group.stats}
            onOpenEntityConfig={(key) => {
              const isAgent = group.agents.some((a) => a.key === key);
              if (isAgent) {
                onOpenAgentConfig(key);
              } else {
                onOpenCategoryConfig(key);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

type AggregateStatProps = {
  label: string;
  value: string;
  subValue: string;
  variant?: "default" | "warning";
};

function AggregateStat({
  label,
  value,
  subValue,
  variant = "default",
}: AggregateStatProps) {
  return (
    <div className="text-center">
      <div
        className={cn(
          "text-lg font-bold",
          variant === "warning" && "text-amber-600",
        )}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground">
        {label} ({subValue})
      </div>
    </div>
  );
}
