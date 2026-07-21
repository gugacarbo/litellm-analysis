import type { DatabaseClient } from "@lite-llm/database/client";
import {
  modelProxyModels,
  modelProxyProviders,
} from "@lite-llm/database/schema";
import { asc, eq } from "drizzle-orm";
import { generateOpenCodeArtifact } from "../lib/opencode-artifact.js";
import type {
  CodingAgentArtifact,
  CodingAgentConnectionMode,
  CodingAgentModelRow,
  CodingAgentsOverview,
  CodingAgentsRepository,
} from "../types/coding-agents.js";
import { ModelAdminError } from "../types/model-admin.js";

export interface CodingAgentsServiceOptions {
  db?: DatabaseClient;
  repository?: CodingAgentsRepository;
  publicBaseUrl?: string;
}

export class CodingAgentsService {
  private readonly repository: CodingAgentsRepository;
  private readonly publicBaseUrl?: string;

  constructor(options: CodingAgentsServiceOptions = {}) {
    this.repository =
      options.repository ??
      new DrizzleCodingAgentsRepository(
        options.db ??
          (() => {
            throw new Error("CodingAgentsService requires db or repository");
          })(),
      );
    this.publicBaseUrl =
      options.publicBaseUrl?.trim() ||
      process.env.MODEL_PROXY_PUBLIC_BASE_URL?.trim() ||
      undefined;
  }

  async getOverview(): Promise<CodingAgentsOverview> {
    const [providers, models] = await Promise.all([
      this.repository.listProviders(),
      this.repository.listEnabledModels(),
    ]);
    const countByProvider = new Map<string, number>();
    for (const model of models)
      countByProvider.set(
        model.providerId,
        (countByProvider.get(model.providerId) ?? 0) + 1,
      );
    return {
      providers: providers.map((provider) => ({
        id: provider.id,
        name: provider.name,
        adapter: provider.provider,
        baseUrl: provider.baseUrl,
        enabledModelCount: countByProvider.get(provider.id) ?? 0,
      })),
      enabledModelCount: models.length,
      publicBaseUrlConfigured: Boolean(this.publicBaseUrl),
    };
  }

  async generateArtifact(
    mode: CodingAgentConnectionMode,
  ): Promise<CodingAgentArtifact> {
    const [providers, models] = await Promise.all([
      this.repository.listProviders(),
      this.repository.listEnabledModels(),
    ]);
    try {
      return generateOpenCodeArtifact({
        mode,
        providers,
        models,
        publicBaseUrl: this.publicBaseUrl,
      });
    } catch (cause) {
      throw new ModelAdminError(
        "VALIDATION",
        cause instanceof Error
          ? cause.message
          : "Unable to generate OpenCode config",
      );
    }
  }
}

class DrizzleCodingAgentsRepository implements CodingAgentsRepository {
  constructor(private readonly db: DatabaseClient) {}

  listProviders() {
    return this.db
      .select()
      .from(modelProxyProviders)
      .orderBy(asc(modelProxyProviders.name));
  }

  listEnabledModels(): Promise<CodingAgentModelRow[]> {
    return this.db
      .select()
      .from(modelProxyModels)
      .where(eq(modelProxyModels.enabled, true))
      .orderBy(asc(modelProxyModels.modelId));
  }
}
