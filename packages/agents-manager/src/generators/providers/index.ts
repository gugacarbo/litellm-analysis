import * as fs from 'node:fs';
import type { DbAgentEntry, DbCategoryEntry } from '../../types/index.js';
import type { OpenCodeProviders } from './types.js';
import {
  buildLiteLLMProviderConfig,
  buildAgentModels,
} from './model-builder.js';
import { mergeModelsFromDb, type DbModelWithParams } from './merger.js';

// ── Providers Generator: Generate opencode.json ──

export interface IProvidersGenerator {
  write(
    config?: unknown,
    dbModels?: DbModelWithParams[],
  ): Promise<void>;
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
    const { readDb } = await import('../../index.js');
    const db = await readDb();
    const providers: OpenCodeProviders = { provider: {} };

    const mergedModels = mergeModelsFromDb(db.models, dbModels);
    providers.provider.litellm = buildLiteLLMProviderConfig(
      mergedModels,
      db.litellm,
    );

    this.addEntityProviders(db.agents, providers);
    this.addEntityProviders(db.categories, providers);

    await fs.promises.writeFile(
      this.providersFile,
      JSON.stringify(providers, null, 2),
      'utf-8',
    );
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
        npm: '@ai-sdk/openai-compatible',
        options: {
          baseURL: 'http://localhost:4000/v1',
          apiKey: 'sk-123456789',
        },
        models: buildAgentModels(key, fallbackCount),
      };
    }
  }
}

// ── Factory ──

export function createProvidersGenerator(providersFile: string): ProvidersGenerator {
  return new ProvidersGenerator(providersFile);
}
