import { createAgentsManager } from "@lite-llm/agents-manager";
import type { AnalyticsDataSource } from "@lite-llm/analytics/types";
import type { DbModelSpecLike } from "../types/index.js";
import { buildLiteLLMParams } from "./lite-llm-params.js";

export async function syncModelsDirectlyToDatabase(
  dataSource: AnalyticsDataSource,
  models: Record<string, DbModelSpecLike>,
): Promise<void> {
  const desiredEntries = Object.entries(models || {});
  const desiredNames = new Set(desiredEntries.map(([name]) => name));
  const existing = await dataSource.getModels();

  const existingCounts = new Map<string, number>();
  for (const item of existing) {
    existingCounts.set(
      item.modelName,
      (existingCounts.get(item.modelName) || 0) + 1,
    );
  }

  const namesToDelete = new Set<string>();

  for (const modelName of existingCounts.keys()) {
    if (!desiredNames.has(modelName)) {
      namesToDelete.add(modelName);
    }
  }

  for (const [, count] of existingCounts.entries()) {
    if (count > 1) {
      for (const modelName of existingCounts.keys()) {
        namesToDelete.add(modelName);
      }
    }
  }

  for (const modelName of namesToDelete) {
    await dataSource.deleteModel(modelName);
    existingCounts.delete(modelName);
  }

  for (const [modelName, spec] of desiredEntries) {
    const litellmParams = buildLiteLLMParams(modelName, spec);

    if (existingCounts.has(modelName)) {
      await dataSource.updateModel(modelName, { litellmParams });
      continue;
    }

    await dataSource.createModel({ modelName, litellmParams });
    existingCounts.set(modelName, 1);
  }
}

export async function syncGeneratedArtifacts(
  dataSource: AnalyticsDataSource,
): Promise<void> {
  const { repository, registry } = createAgentsManager();

  // Sync models to database
  const config = await repository.read();
  await syncModelsDirectlyToDatabase(dataSource, config.models || {});

  // Export config files via plugins
  await registry.exportAll();
}
