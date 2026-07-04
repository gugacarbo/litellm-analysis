export {
  fromModelProxyRow,
  fromModelRoute,
  type ModelProxyRowWrite,
  parseModelRouteFromApi,
  toModelProxyRow,
  toModelRoute,
} from "./adapters/model-route-adapter.js";
export { getRegistryDb, type RegistryClientOptions } from "./client.js";
export {
  getModelRoute,
  listRegistryModels,
  type RegistryModelEntry,
  toRegistryEntry,
} from "./dual-read/models-dual-read.js";
export {
  listProviders,
  type ProviderListItem,
  providerExists,
  toPublicProvider,
} from "./dual-read/providers-dual-read.js";
export {
  getDefaultProvider,
  getHealthCheckPrompt,
  getRouterSettings,
} from "./dual-read/settings-dual-read.js";
export { createRegistryServices, type RegistryServices } from "./factory.js";
export {
  decryptProviderSecret,
  encryptProviderSecret,
  hasStoredProviderSecret,
  isEncryptedProviderSecret,
  looksLikeEnvVarName,
  parseProviderEncryptionKey,
  resolveProviderSecret,
} from "./lib/provider-secrets.js";
export { ModelsRepository } from "./repositories/models-repository.js";
export { ProvidersRepository } from "./repositories/providers-repository.js";
export { SettingsRepository } from "./repositories/settings-repository.js";
export {
  ApiKeysService,
  type ApiKeysServiceOptions,
  type IApiKeysService,
} from "./services/api-keys.service.js";
export {
  type IOpenAiOAuthService,
  OpenAiOAuthService,
  type OpenAiOAuthServiceOptions,
} from "./services/openai-oauth.service.js";
export {
  type IProvidersService,
  ProvidersService,
  type ProvidersServiceOptions,
} from "./services/providers.service.js";
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
  MODEL_ROUTE_TO_SNAKE_PARAM,
  normalizeSyncDirection,
  normalizeSyncPresenceStatus,
  RESERVED_ROUTE_PARAM_KEYS,
  ROUTE_PARAM_TO_MODEL_ROUTE,
  SETTING_KEYS,
} from "./types/index.js";
export type * from "./types/openai-oauth.js";
export {
  OPENAI_CHATGPT_API_BASE,
  OPENAI_CHATGPT_AUTH_BASE,
  OPENAI_CHATGPT_CLIENT_ID,
  OPENAI_CHATGPT_DEVICE_CODE_URL,
  OPENAI_CHATGPT_DEVICE_TOKEN_URL,
  OPENAI_CHATGPT_DEVICE_VERIFY_URL,
  OPENAI_CHATGPT_OAUTH_TOKEN_URL,
} from "./types/openai-oauth.js";
