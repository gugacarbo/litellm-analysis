import type {
  ModelProxyModel,
  ModelProxyProvider,
} from "@lite-llm/database/schema";

export type CodingAgentConnectionMode = "hebo" | "providers";

export interface CodingAgentProviderOption {
  id: string;
  name: string;
  adapter: string | null;
  baseUrl: string | null;
  enabledModelCount: number;
}

export interface CodingAgentsOverview {
  providers: CodingAgentProviderOption[];
  enabledModelCount: number;
  publicBaseUrlConfigured: boolean;
}

export interface CodingAgentArtifact {
  fileName: string;
  content: string;
  mediaType: "application/json";
  modelCount: number;
  warnings: string[];
}

export type CodingAgentProviderRow = ModelProxyProvider;
export type CodingAgentModelRow = ModelProxyModel;

export interface CodingAgentsRepository {
  listProviders(): Promise<CodingAgentProviderRow[]>;
  listEnabledModels(): Promise<CodingAgentModelRow[]>;
}
