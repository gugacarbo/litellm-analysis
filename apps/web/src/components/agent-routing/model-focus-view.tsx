import { ChevronRight, Palette } from "lucide-react";
import { cn } from "../../lib/utils";
import type { AgentDefinition } from "../../types/agent-routing";
import { Badge } from "../badge";
import { Button } from "../button";

type ConfigInfo = {
  model: string;
  description?: string;
  color?: string;
  fallbackCount: number;
};

type ModelGroup = {
  modelName: string;
  agents: AgentDefinition[];
  primaryColor: string;
  totalFallbacks: number;
};

type Props = {
  loading: boolean;
  agents: AgentDefinition[];
  getAgentConfigInfo: (key: string) => ConfigInfo | null;
  onOpenAgentConfig: (key: string) => void;
};

const MODEL_COLORS = [
  {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-600",
    dot: "bg-emerald-500",
  },
  {
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    text: "text-sky-600",
    dot: "bg-sky-500",
  },
  {
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    text: "text-violet-600",
    dot: "bg-violet-500",
  },
  {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-600",
    dot: "bg-amber-500",
  },
  {
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    text: "text-rose-600",
    dot: "bg-rose-500",
  },
  {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    text: "text-cyan-600",
    dot: "bg-cyan-500",
  },
  {
    bg: "bg-fuchsia-500/10",
    border: "border-fuchsia-500/30",
    text: "text-fuchsia-600",
    dot: "bg-fuchsia-500",
  },
  {
    bg: "bg-teal-500/10",
    border: "border-teal-500/30",
    text: "text-teal-600",
    dot: "bg-teal-500",
  },
];

function getModelColor(modelName: string): (typeof MODEL_COLORS)[number] {
  let hash = 0;
  for (let i = 0; i < modelName.length; i++) {
    hash = modelName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MODEL_COLORS[Math.abs(hash) % MODEL_COLORS.length];
}

export function ModelFocusView({
  loading,
  agents,
  getAgentConfigInfo,
  onOpenAgentConfig,
}: Props) {
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

  const modelGroupsMap = new Map<string, ModelGroup>();

  for (const row of rows) {
    if (!row.hasPrimaryModel || !row.configInfo) continue;
    const modelName = row.configInfo.model;
    const color = getModelColor(modelName);

    const existing = modelGroupsMap.get(modelName);
    if (existing) {
      existing.agents.push(row.agent);
      existing.totalFallbacks += row.configInfo.fallbackCount;
    } else {
      modelGroupsMap.set(modelName, {
        modelName,
        agents: [row.agent],
        primaryColor: color.dot.replace("bg-", ""),
        totalFallbacks: row.configInfo.fallbackCount,
      });
    }
  }

  const modelGroups = Array.from(modelGroupsMap.entries())
    .map(([, group]) => group)
    .sort((a, b) => b.agents.length - a.agents.length);

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
        {modelGroups.map((group) => {
          const color = getModelColor(group.modelName);
          return (
            <div
              key={group.modelName}
              className={cn(
                "group relative overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-md",
                color.bg,
                color.border,
              )}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20" />

              <div className="p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          color.dot,
                        )}
                      />
                      <p
                        className={cn(
                          "truncate font-mono text-sm font-semibold",
                          color.text,
                        )}
                      >
                        {group.modelName}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {group.agents.length} agent
                      {group.agents.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {group.agents.slice(0, 4).map((agent) => (
                    <div
                      key={agent.key}
                      className="flex items-center justify-between rounded-lg bg-background/60 px-2.5 py-1.5 text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{agent.icon}</span>
                        <span className="truncate font-medium">
                          {agent.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => onOpenAgentConfig(agent.key)}
                      >
                        <Palette className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  {group.agents.length > 4 && (
                    <div className="py-1 text-center">
                      <span className="text-xs text-muted-foreground">
                        +{group.agents.length - 4} more
                      </span>
                    </div>
                  )}
                </div>

                {group.totalFallbacks > 0 && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ChevronRight className="h-3 w-3" />
                    <span>
                      {group.totalFallbacks} fallback
                      {group.totalFallbacks === 1 ? "" : "s"}
                    </span>
                  </div>
                )}
              </div>

              <div
                className={cn(
                  "absolute bottom-0 right-0 size-16 -translate-y-1/2 translate-x-1/3 rounded-full blur-2xl",
                  color.dot,
                  "opacity-20",
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
