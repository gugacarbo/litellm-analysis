import type { createAgentsManager } from "@lite-llm/agents-manager";
import type { AnalyticsDataSource } from "@lite-llm/analytics-service/types";
import type {
  IApiKeysService,
  IOpenAiOAuthService,
  IRegistryModelsService,
  ISettingsService,
} from "@lite-llm/llm-config-service";
import type { HeboModelProxyGateway } from "@lite-llm/llm-gateway/hebo";
import type { IModelService, IProviderService } from "@lite-llm/models-service";

export interface RegistryRouteServices {
  settingsService: ISettingsService;
  registryModelsService: IRegistryModelsService;
  apiKeysService: IApiKeysService;
  openAiOAuthService: IOpenAiOAuthService;
}

export type AgentsManager = ReturnType<typeof createAgentsManager>;

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
}

export interface RouteOptions {
  dataSource: AnalyticsDataSource;
  orchestration: OrchestrationServices;
  heboGateway: HeboModelProxyGateway;
  modelsService: IModelService;
  providerService: IProviderService;
  registry: RegistryRouteServices;
  agentsManager?: AgentsManager;
}
