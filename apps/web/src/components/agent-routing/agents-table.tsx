import { Circle, Layers, Palette } from "lucide-react";
import { cn } from "../../lib/utils";
import type { AgentDefinition } from "@lite-llm/api-contracts/agent-routing";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

type ConfigInfo = {
  model: string;
  description?: string;
  color?: string;
  fallbackCount: number;
};

type AgentsTableProps = {
  loading: boolean;
  agents: AgentDefinition[];
  getAgentConfigInfo: (key: string) => ConfigInfo | null;
  onOpenAgentConfig: (key: string) => void;
};

export function AgentsTable({
  loading,
  agents,
  getAgentConfigInfo,
  onOpenAgentConfig,
}: AgentsTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No agents available.
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

  const configuredCount = rows.filter((row) => row.hasPrimaryModel).length;
  const totalFallbacks = rows.reduce(
    (sum, row) => sum + (row.configInfo?.fallbackCount || 0),
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
          <span>
            <span className="font-medium text-foreground">
              {configuredCount}
            </span>
            /{agents.length} configured
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Layers className="h-3 w-3" />
          <span>
            <span className="font-medium text-foreground">
              {totalFallbacks}
            </span>{" "}
            fallback{totalFallbacks === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ agent, configInfo, hasPrimaryModel }) => (
          <div
            key={agent.key}
            className={cn(
              "group flex items-center gap-3 rounded-lg border p-2 transition-colors hover:bg-muted/50",
              hasPrimaryModel
                ? "border-transparent bg-card"
                : "border-dashed border-border/50 bg-muted/30",
            )}
          >
            <span className="text-xl">{agent.icon}</span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{agent.name}</p>
                {configInfo?.color ? (
                  <div
                    className="size-2 shrink-0 rounded-full border border-border/50"
                    style={{ backgroundColor: configInfo.color }}
                  />
                ) : null}
              </div>
              <div className="flex items-center gap-1.5">
                {configInfo ? (
                  <Badge
                    variant="outline"
                    className="h-auto py-0 font-mono text-[10px]"
                  >
                    {configInfo.model}
                  </Badge>
                ) : (
                  <span className="text-[10px] text-muted-foreground">
                    Unassigned
                  </span>
                )}
                {configInfo?.fallbackCount ? (
                  <span className="text-[10px] text-muted-foreground">
                    +{configInfo.fallbackCount}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onOpenAgentConfig(agent.key)}
                title="Edit configuration"
              >
                <Palette className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
