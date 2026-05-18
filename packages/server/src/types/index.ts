import type { AgentPluginsOrchestrator } from "@lite-llm/agent-plugins";
import type { AnalyticsDataSource } from "@lite-llm/analytics-service/types";
import type { IModelService } from "@lite-llm/models-service";

export type AgentsManager = AgentPluginsOrchestrator;

export interface DbModelSpecLike {
  displayName?: string;
  enabled?: boolean;
  family?: string;
  limits: {
    length: number;
    maxOutput: number;
  };
  cost?: {
    input?: number;
    output?: number;
  };
}

export interface OrchestrationServices {
  dataSource: AnalyticsDataSource;
  syncGeneratedArtifacts: () => Promise<void>;
  syncModelsDirectlyToDatabase: (
    models: Record<string, DbModelSpecLike>,
  ) => Promise<void>;
}

export interface RouteOptions {
  dataSource: AnalyticsDataSource;
  orchestration: OrchestrationServices;
  modelsService: IModelService;
  agentsManager?: AgentsManager;
}
