import type {
  IRegistryModelsService,
  ISettingsService,
} from "@lite-llm/model-proxy-registry-service";
import type { IModelService } from "@lite-llm/models-service";
import type { AgentsManager } from "../types/index";

/**
 * Syncs generated artifact files (configs, provider models) to disk.
 */
export async function syncGeneratedArtifacts(
  _registryModelsService: IRegistryModelsService,
  _settingsService: ISettingsService,
  agentsManager: AgentsManager,
  _modelsService: IModelService,
): Promise<void> {
  const { registry } = agentsManager;

  await registry.exportAll();
}
