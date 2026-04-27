import * as fs from "node:fs";
import * as path from "node:path";
import { generateLitellmAliases } from "@lite-llm/alias-router";
import type { DbAgentEntry, DbCategoryEntry } from "../../types/index.js";
import { type DbModelWithParams, mergeModelsFromDb } from "./merger.js";
import {
  buildAgentModels,
  buildLiteLLMProviderConfig,
} from "./model-builder.js";
import type { OpenCodeProviders } from "./types.js";

// ── Providers Generator: Generate opencode.json ──

export interface IProvidersGenerator {
  write(config?: unknown, dbModels?: DbModelWithParams[]): Promise<void>;
}

export class ProvidersGenerator implements IProvidersGenerator {
  private readonly providersFile: string;

  constructor(providersFile: string) {
    this.providersFile = providersFile;
  }

  async write(
    _config?: unknown,
    dbModels?: DbModelWithParams[],
  ): Promise<void> {
    const { readDb } = await import("../../index.js");
    const db = await readDb();
    const providers: OpenCodeProviders = { provider: {} };

    const mergedModels = mergeModelsFromDb(db.models, dbModels);
    providers.provider.litellm = buildLiteLLMProviderConfig(
      mergedModels,
      db.litellm,
    );

    this.addEntityProviders(db.agents, providers);
    this.addEntityProviders(db.categories, providers);

    // Generate ALL model_group_alias entries from all agents and categories
    const globalFallback = db.globalFallbackModel;
    const modelGroupAlias: Record<string, string> = {};

    for (const [key, agent] of Object.entries(db.agents)) {
      const aliases = generateLitellmAliases(
        key,
        agent.model || "",
        agent.fallbackModels,
        globalFallback,
      );
      Object.assign(modelGroupAlias, aliases);
    }

    for (const [key, category] of Object.entries(db.categories)) {
      const aliases = generateLitellmAliases(
        key,
        category.model || "",
        category.fallbackModels,
        globalFallback,
      );
      Object.assign(modelGroupAlias, aliases);
    }

    providers.model_group_alias = modelGroupAlias;

    await this.ensureDir();
    const tmpPath = `${this.providersFile}.tmp`;
    await fs.promises.writeFile(
      tmpPath,
      JSON.stringify(providers, null, 2),
      "utf-8",
    );
    await fs.promises.rename(tmpPath, this.providersFile);
  }

  private async ensureDir(): Promise<void> {
    const dir = path.dirname(this.providersFile);
    await fs.promises.mkdir(dir, { recursive: true });
  }

  private addEntityProviders(
    entities: Record<string, DbAgentEntry | DbCategoryEntry>,
    providers: OpenCodeProviders,
  ): void {
    for (const [key, entity] of Object.entries(entities)) {
      if (Object.keys(entity).length === 0) continue;

      const fallbackCount = (entity.fallbackModels || []).filter((f) =>
        f?.startsWith(`${key}/`),
      ).length;

      providers.provider[key] = {
        npm: "@ai-sdk/openai-compatible",
        options: {
          baseURL: "http://localhost:4000/v1",
          apiKey: "sk-123456789",
        },
        models: buildAgentModels(key, fallbackCount),
      };
    }
  }
}

// ── Factory ──

export function createProvidersGenerator(
  providersFile: string,
): ProvidersGenerator {
  return new ProvidersGenerator(providersFile);
}
