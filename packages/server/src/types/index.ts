import type { AgentPluginsOrchestrator } from "@lite-llm/agent-plugins";
import type { AnalyticsDataSource } from "@lite-llm/analytics-service/types";
import type {
  IApiKeysService,
  IRegistryModelsService,
  ISettingsService,
} from "@lite-llm/model-proxy-registry-service";
import type { IModelProxyService } from "@lite-llm/model-proxy-service";
import type { IModelService, IProviderService } from "@lite-llm/models-service";

export interface RegistryRouteServices {
  settingsService: ISettingsService;
  registryModelsService: IRegistryModelsService;
  apiKeysService: IApiKeysService;
}

export type AgentsManager = AgentPluginsOrchestrator;

export interface DbModelSpecLike {
  displayName?: string;
  enabled?: boolean;
  family?: string;
  ownedBy?: string;
  apiMode?: "openai" | "anthropic";
  vision?: boolean;
  limits: {
    length: number;
    maxOutput: number;
  };
  cost?: {
    input?: number;
    output?: number;
  };
  thinking?: {
    levels: string[];
  };
  reasoning?: {
    effort?: "low" | "medium" | "high" | "xhigh";
    enableThinking?: boolean;
    includeReasoningInRequest?: boolean;
  };
}

export interface OrchestrationServices {
  dataSource: AnalyticsDataSource;
  syncGeneratedArtifacts: () => Promise<void>;
  syncModelsDirectlyToDatabase(
    models: Record<string, DbModelSpecLike>,
  ): Promise<void>;
}

export interface RouteOptions {
  dataSource: AnalyticsDataSource;
  orchestration: OrchestrationServices;
  modelProxyService: IModelProxyService;
  modelsService: IModelService;
  providerService: IProviderService;
  registry: RegistryRouteServices;
  agentsManager?: AgentsManager;
}
