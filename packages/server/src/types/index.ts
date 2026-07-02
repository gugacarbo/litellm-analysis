import type { AgentPluginsOrchestrator } from "@lite-llm/agent-plugins";
import type { AnalyticsDataSource } from "@lite-llm/analytics-service/types";
import type {
  IApiKeysService,
  IOpenAiOAuthService,
  IProvidersService,
  IRegistryModelsService,
  ISettingsService,
} from "@lite-llm/model-proxy-registry-service";
import type { HeboModelProxyGateway } from "@lite-llm/model-proxy-service/hebo";
import type { IModelService, IProviderService } from "@lite-llm/models-service";

export interface RegistryRouteServices {
  settingsService: ISettingsService;
  registryModelsService: IRegistryModelsService;
  providersService: IProvidersService;
  apiKeysService: IApiKeysService;
  openAiOAuthService: IOpenAiOAuthService;
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
