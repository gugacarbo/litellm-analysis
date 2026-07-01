export {
  fromModelProxyRow,
  fromModelRoute,
  type ModelProxyRowWrite,
  parseModelRouteFromApi,
  toModelProxyRow,
  toModelRoute,
} from "./adapters/model-route-adapter.js";
export { getRegistryPrisma, type RegistryClientOptions } from "./client.js";
export {
  type CredentialListItem,
  credentialExists,
  listCredentials,
  toPublicCredential,
} from "./dual-read/credentials-dual-read.js";
export {
  getModelRoute,
  listRegistryModels,
  type RegistryModelEntry,
  toRegistryEntry,
} from "./dual-read/models-dual-read.js";
export {
  getDefaultCredential,
  getHealthCheckPrompt,
  getRouterSettings,
} from "./dual-read/settings-dual-read.js";
export { createRegistryServices, type RegistryServices } from "./factory.js";
export {
  decryptCredentialSecret,
  encryptCredentialSecret,
  hasStoredCredentialSecret,
  isEncryptedCredentialSecret,
  looksLikeEnvVarName,
  parseCredentialEncryptionKey,
  resolveCredentialSecret,
} from "./lib/credential-secrets.js";
export { CredentialsRepository } from "./repositories/credentials-repository.js";
export { ModelsRepository } from "./repositories/models-repository.js";
export { SettingsRepository } from "./repositories/settings-repository.js";
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
  type IOpenAiOAuthService,
  OpenAiOAuthService,
  type OpenAiOAuthServiceOptions,
} from "./services/openai-oauth.service.js";
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
