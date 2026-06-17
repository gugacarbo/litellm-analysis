import { serverEnv } from "@lite-llm/config/server";
import {
  getDefaultCredential,
  type IRegistryModelsService,
  type ISettingsService,
} from "@lite-llm/model-proxy-registry-service";
import type { IModelService } from "@lite-llm/models-service";
import type { AgentsManager, DbModelSpecLike } from "../types/index";
import {
  createRegistryModelFromSpec,
  mergeRegistryModelFromSpec,
} from "./registry-models-bridge";

export async function syncModelsDirectlyToDatabase(
  registryModelsService: IRegistryModelsService,
  settingsService: ISettingsService,
  models: Record<string, DbModelSpecLike>,
): Promise<void> {
  if (serverEnv.SETTINGS_STORAGE === "database") {
    return;
  }

  const credentialName = await getDefaultCredential(settingsService);
  const desiredEntries = Object.entries(models || {});
  const desiredNames = new Set(desiredEntries.map(([name]) => name));
  const existing = await registryModelsService.list();

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
    await registryModelsService.delete(modelName);
    existingCounts.delete(modelName);
  }

  for (const [modelName, spec] of desiredEntries) {
    const existingRoute = await registryModelsService.getRoute(modelName);

    if (existingRoute) {
      await mergeRegistryModelFromSpec(
        registryModelsService,
        modelName,
        spec,
        credentialName,
        existingRoute,
      );
      continue;
    }

    await createRegistryModelFromSpec(
      registryModelsService,
      modelName,
      spec,
      credentialName,
    );
    existingCounts.set(modelName, 1);
  }
}

/**
 * Syncs generated artifact files (configs, provider models) to disk.
 */
export async function syncGeneratedArtifacts(
  registryModelsService: IRegistryModelsService,
  settingsService: ISettingsService,
  agentsManager: AgentsManager,
  modelsService: IModelService,
): Promise<void> {
  const { registry } = agentsManager;

  const configModels = await modelsService.getAll();
  await syncModelsDirectlyToDatabase(
    registryModelsService,
    settingsService,
    configModels,
  );

  await registry.exportAll();
}
