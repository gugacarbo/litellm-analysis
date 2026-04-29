import type { AgentDefinition } from "../../types/agent-routing";
import { Badge } from "../ui/badge";
import type { ConfigInfo } from "./agent-routing-types";
import type { EntityItem } from "./model-station-card";
import { ModelStationCard } from "./model-station-card";

export type ModelFocusViewProps = {
  loading: boolean;
  agents: AgentDefinition[];
  getAgentConfigInfo: (key: string) => ConfigInfo | null;
  onOpenAgentConfig: (key: string) => void;
};

type AgentModelGroup = {
  modelName: string;
  agents: EntityItem[];
  totalFallbacks: number;
};

export function ModelFocusView({
  loading,
  agents,
  getAgentConfigInfo,
  onOpenAgentConfig,
}: ModelFocusViewProps) {
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

  const rows = agents.map((agent) => {
    const configInfo = getAgentConfigInfo(agent.key);
    return {
      agent,
      configInfo,
      hasPrimaryModel: Boolean(configInfo && configInfo.model !== "Unassigned"),
    };
  });

  const modelGroupsMap = new Map<string, AgentModelGroup>();

  for (const row of rows) {
    if (!row.hasPrimaryModel || !row.configInfo) continue;
    const modelName = row.configInfo.model;

    const existing = modelGroupsMap.get(modelName);
    if (existing) {
      existing.agents.push({
        key: row.agent.key,
        name: row.agent.name,
        icon: row.agent.icon,
      });
      existing.totalFallbacks += row.configInfo.fallbackCount;
    } else {
      modelGroupsMap.set(modelName, {
        modelName,
        agents: [
          { key: row.agent.key, name: row.agent.name, icon: row.agent.icon },
        ],
        totalFallbacks: row.configInfo.fallbackCount,
      });
    }
  }

  const modelGroups = Array.from(modelGroupsMap.values()).sort(
    (a, b) => b.agents.length - a.agents.length,
  );

  if (modelGroups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="font-medium">No models configured</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign models to agents to see them here.
        </p>
      </div>
    );
  }

  const totalAgents = modelGroups.reduce((sum, g) => sum + g.agents.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Model Stations</h3>
          <p className="text-xs text-muted-foreground">
            {modelGroups.length} model{modelGroups.length === 1 ? "" : "s"}{" "}
            serving {totalAgents} agent{totalAgents === 1 ? "" : "s"}
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
            entities={group.agents}
            totalFallbacks={group.totalFallbacks}
            onOpenEntityConfig={onOpenAgentConfig}
          />
        ))}
      </div>
    </div>
  );
}
