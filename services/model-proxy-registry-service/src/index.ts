export {
  buildSettingsRows,
  extractDefaultCredential,
  extractHealthCheckPrompt,
  importLegacyConfig,
  type LegacyConfigAdapterOptions,
  type LegacyConfigQueryFn,
  type LegacyConfigReader,
  type LegacyConfigSource,
  type LegacySettingRow,
  readLegacyConfigSource,
} from "./adapters/legacy-config-adapter.js";
export {
  deriveSecretRef,
  deriveSecretRefFromCredentialName,
  importLegacyCredentials,
  type LegacyCredentialRow,
  type LegacyCredentialsAdapterOptions,
  type LegacyCredentialsReader,
  type LiteLLMCredentialRow,
  type MappedLegacyCredential,
  mapLegacyCredential,
  mapLegacyCredentialRow,
  type RequiredEnvVarEntry,
} from "./adapters/legacy-credentials-adapter.js";
export {
  dedupeLegacyModels,
  type LegacyModelRow,
  toModelProxyRow as legacyToModelProxyRow,
} from "./adapters/legacy-models-adapter.js";
export {
  fromModelProxyRow,
  fromModelRoute,
  type ModelProxyRowWrite,
  toModelProxyRow,
  toModelRoute,
} from "./adapters/litellm-params-adapter.js";
export { getRegistryPrisma, type RegistryClientOptions } from "./client.js";
export {
  type CredentialListItem,
  credentialExistsWithFallback,
  listCredentialsWithFallback,
  toPublicCredential,
} from "./dual-read/credentials-dual-read.js";
export {
  getModelRouteWithRegistryFirst,
  type LegacyModelEntry,
  listModelsWithRegistryFirst,
  toLegacyEntry,
} from "./dual-read/models-dual-read.js";
export {
  getDefaultCredentialWithFallback,
  getHealthCheckPromptWithFallback,
  getRouterSettingsWithFallback,
} from "./dual-read/settings-dual-read.js";
export { createRegistryServices, type RegistryServices } from "./factory.js";
export {
  createEmptyPhaseCounts,
  createEmptySummary,
  type ImportLegacyOptions,
  type ImportPhase,
  type ImportSummary,
  mergePhaseCounts,
  type PhaseCounts,
} from "./import/import-summary.js";
export {
  parseImportCliArgs,
  printImportHelp,
} from "./import/parse-cli-args.js";
export {
  printImportSummary,
  runLegacyImport,
} from "./import/run-legacy-import.js";
export {
  ApiKeysService,
  type ApiKeysServiceOptions,
  type IApiKeysService,
} from "./services/api-keys.service.js";
export {
  CredentialsService,
  type CredentialsServiceOptions,
  type ICredentialsService,
} from "./services/credentials.service.js";
export {
  type IRegistryModelsService,
  RegistryModelsService,
  type RegistryModelsServiceOptions,
} from "./services/registry-models.service.js";
export {
  type ISettingsService,
  SettingsService,
  type SettingsServiceOptions,
} from "./services/settings.service.js";

export type * from "./types/index.js";
export {
  LITELLM_PARAM_TO_MODEL_ROUTE,
  MODEL_ROUTE_TO_LITELLM_PARAM,
  normalizeSyncDirection,
  normalizeSyncPresenceStatus,
  RESERVED_LITELLM_PARAM_KEYS,
  SETTING_KEYS,
} from "./types/index.js";
