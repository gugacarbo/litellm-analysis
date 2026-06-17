import {
  fromModelRoute,
  getDefaultCredentialWithFallback,
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
  const credentialName =
    await getDefaultCredentialWithFallback(settingsService);
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

  const existingByName = new Map<string, Record<string, unknown>>();
  for (const item of existing) {
    const route = await registryModelsService.getRoute(item.modelName);
    existingByName.set(item.modelName, route ? fromModelRoute(route) : {});
  }

  for (const [modelName, spec] of desiredEntries) {
    const existingParams = existingByName.get(modelName) ?? {};

    if (existingCounts.has(modelName)) {
      await mergeRegistryModelFromSpec(
        registryModelsService,
        modelName,
        spec,
        credentialName,
        existingParams,
      );
      continue;
    }

    await createRegistryModelFromSpec(
      registryModelsService,
      modelName,
      spec,
      credentialName,
      existingParams,
    );
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
