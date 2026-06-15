import type { AnalyticsDataSource } from "@lite-llm/analytics-service/types";
import type { IModelService } from "@lite-llm/models-service";
import type { AgentsManager, DbModelSpecLike } from "../types/index";
import { buildMergedLiteLLMParams, isRecord } from "./lite-llm-params";

export async function syncModelsDirectlyToDatabase(
  dataSource: AnalyticsDataSource,
  models: Record<string, DbModelSpecLike>,
): Promise<void> {
  const credentialName = await dataSource.getDefaultCredential();
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

  const existingByName = new Map(
    existing.map((item) => [item.modelName, item]),
  );

  for (const [modelName, spec] of desiredEntries) {
    const existingModel = existingByName.get(modelName);
    const existingParams = isRecord(existingModel?.litellmParams)
      ? existingModel.litellmParams
      : {};
    const litellmParams = buildMergedLiteLLMParams(
      modelName,
      spec,
      existingParams,
      credentialName,
    );

    if (existingCounts.has(modelName)) {
      await dataSource.updateModel(modelName, { litellmParams });
      continue;
    }

    await dataSource.createModel({ modelName, litellmParams });
    existingCounts.set(modelName, 1);
  }
}

/**
 * Syncs generated artifact files (configs, provider models) to disk.
 *
 * Only built-in plugins (those registered automatically by createAgentPluginsOrchestrator,
 * currently OpenCodePlugin) are exported by default. External plugins such as
 * OpenAgentPlugin or VsCodePlugin must be explicitly registered on the registry
 * instance before calling this function (or before exportAll()) to be included
 * in the output.
 *
 * This means only intentionally enabled plugins produce output files — no plugin
 * is exported unless it has been registered via registry.register().
 */
export async function syncGeneratedArtifacts(
  dataSource: AnalyticsDataSource,
  agentsManager: AgentsManager,
  modelsService: IModelService,
): Promise<void> {
  const { registry } = agentsManager;

  // Sync models to database
  const configModels = await modelsService.getAll();
  await syncModelsDirectlyToDatabase(dataSource, configModels);

  // Export config files via all registered plugins.
  // Only built-in + any plugins explicitly registered elsewhere will produce output.
  await registry.exportAll();
}
