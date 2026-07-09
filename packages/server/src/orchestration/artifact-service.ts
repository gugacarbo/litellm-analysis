import type {
  IRegistryModelsService,
  ISettingsService,
} from "@lite-llm/llm-config-service";

/**
 * Syncs generated artifact files (configs, provider models) to disk.
 *
 * Plugin artifact generation was removed in this cutover, so this hook is
 * intentionally a no-op for now.
 */
export async function syncGeneratedArtifacts(
  _registryModelsService: IRegistryModelsService,
  _settingsService: ISettingsService,
): Promise<void> {
  return void 0;
}
