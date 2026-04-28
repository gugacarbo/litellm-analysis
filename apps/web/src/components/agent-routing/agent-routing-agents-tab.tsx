import {
  ChevronDown,
  ChevronRight,
  LayersIcon,
  UserIcon,
  Zap,
} from "lucide-react";
import { useState } from "react";
import type { AgentDefinition } from "../../types/agent-routing";
import { Badge } from "../badge";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { AgentFocusView } from "./agent-focus-view";
import { ModelFocusView } from "./model-focus-view";

type ConfigInfo = {
  model: string;
  description?: string;
  color?: string;
  fallbackCount: number;
};

type Props = {
  loading: boolean;
  agents: AgentDefinition[];
  models: string[];
  onOpenAgentConfig: (key: string) => void;
  onQuickModelChange: (agentKey: string, model: string) => void;
  getAgentConfigInfo: (key: string) => ConfigInfo | null;
};

export function AgentRoutingAgentsTab({
  loading,
  agents,
  models,
  onOpenAgentConfig,
  onQuickModelChange,
  getAgentConfigInfo,
}: Props) {
  const [showModelStations, setShowModelStations] = useState(false);

  const configuredAgentsCount = agents.filter((agent) => {
    const config = getAgentConfigInfo(agent.key);
    return Boolean(config && config.model !== "Unassigned");
  }).length;

  const totalFallbacks = agents.reduce((sum, agent) => {
    const config = getAgentConfigInfo(agent.key);
    return sum + (config?.fallbackCount ?? 0);
  }, 0);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center flex-1 justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-5" />
              Agent Routing
            </CardTitle>
            <div className="flex items-center text-muted-foreground gap-4 ">
              <div className=" flex items-center gap-1.5">
                <UserIcon className="size-4" />
                <span className="text-sm text-foreground">
                  <span className="font-medium ">{configuredAgentsCount}</span>/
                  {agents.length} configured
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <LayersIcon className="size-4" />
                <span className="text-sm text-foreground">
                  <span className="font-medium text-foreground">
                    {totalFallbacks}
                  </span>{" "}
                  fallback{totalFallbacks === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <AgentFocusView
            loading={loading}
            agents={agents}
            models={models}
            getAgentConfigInfo={getAgentConfigInfo}
            onOpenAgentConfig={onOpenAgentConfig}
            onQuickModelChange={onQuickModelChange}
          />

          <div className="rounded-lg border">
            <button
              type="button"
              onClick={() => setShowModelStations(!showModelStations)}
              className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Model Stations</span>
                <Badge variant="secondary" className="font-normal">
                  visualização
                </Badge>
              </div>
              {showModelStations ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {showModelStations && (
              <div className="border-t p-3">
                <ModelFocusView
                  loading={loading}
                  agents={agents}
                  getAgentConfigInfo={getAgentConfigInfo}
                  onOpenAgentConfig={onOpenAgentConfig}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
