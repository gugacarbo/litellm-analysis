import type { createAgentsManager } from "@lite-llm/agents-manager";
import type { AnalyticsDataSource } from "@lite-llm/analytics/types";

export type AgentsManager = ReturnType<typeof createAgentsManager>;

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
  agentsManager?: AgentsManager;
}
