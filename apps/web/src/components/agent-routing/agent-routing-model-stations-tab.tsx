import type {
  AgentDefinition,
  CategoryDefinition,
} from "@lite-llm/api-contracts/agent-routing";
import { Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TooltipProvider } from "../ui/tooltip";
import type { ConfigInfo } from "./agent-routing-types";
import { CombinedModelView } from "./combined-model-view";

export type AgentRoutingModelStationsTabProps = {
  loading: boolean;
  agents: AgentDefinition[];
  categories: CategoryDefinition[];
  models: string[];
  onOpenAgentConfig: (key: string) => void;
  onOpenCategoryConfig: (key: string) => void;
  getAgentConfigInfo: (key: string) => ConfigInfo | null;
  getCategoryConfigInfo: (key: string) => ConfigInfo | null;
};

export function AgentRoutingModelStationsTab({
  loading,
  agents,
  categories,
  onOpenAgentConfig,
  onOpenCategoryConfig,
  getAgentConfigInfo,
  getCategoryConfigInfo,
}: AgentRoutingModelStationsTabProps) {
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

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center flex-1 justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Layers className="size-5" />
                Model Stations
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  <span className="font-medium text-foreground">
                    {totalConfiguredCount}
                  </span>
                  /{totalEntities} configured
                </span>
                {totalFallbacks > 0 && (
                  <span>
                    <span className="font-medium text-foreground">
                      {totalFallbacks}
                    </span>{" "}
                    fallback{totalFallbacks === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CombinedModelView
              loading={loading}
              agents={agents}
              categories={categories}
              getAgentConfigInfo={getAgentConfigInfo}
              getCategoryConfigInfo={getCategoryConfigInfo}
              onOpenAgentConfig={onOpenAgentConfig}
              onOpenCategoryConfig={onOpenCategoryConfig}
            />
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
