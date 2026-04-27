import type { AnalyticsDataSource } from "@lite-llm/analytics/types";

export interface DbModelSpecLike {
  contextLength: number;
  maxOutput: number;
  cost?: {
    input?: number;
    output?: number;
  };
}

export interface OrchestrationServices {
  dataSource: AnalyticsDataSource;
  buildAliasMap: () => Promise<Record<string, string>>;
  regenerateAllAliases: () => Promise<void>;
  syncGeneratedArtifacts: () => Promise<void>;
  syncModelsDirectlyToDatabase: (
    models: Record<string, DbModelSpecLike>,
  ) => Promise<void>;
}

export interface RouteOptions {
  dataSource: AnalyticsDataSource;
  orchestration: OrchestrationServices;
}
