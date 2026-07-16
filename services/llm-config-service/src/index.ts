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
  getHealthCheckPrompt,
  getRouterSettings,
} from "./dual-read/settings-dual-read.js";
export { createRegistryServices, type RegistryServices } from "./factory.js";
export {
  REDACTED_AUDIT_VALUE,
  redactAuditJson,
} from "./lib/audit-redaction.js";
export {
  encryptProviderSecret,
  parseProviderEncryptionKey,
  resolveProviderCredential,
} from "./lib/provider-secrets.js";
export {
  APPLICATION_SECRET_KEYS,
  type ApplicationSecretKey,
  type ApplicationSecretRecord,
  ApplicationSecretsRepository,
  type ApplicationSecretsRepositoryPort,
  type ProviderSecretRecord,
  providerSecretKey,
} from "./repositories/application-secrets-repository.js";
export {
  AuditEventsRepository,
  type AuditEventsRepositoryListResult,
  type AuditEventsRepositoryPort,
} from "./repositories/audit-events-repository.js";
export { ModelsRepository } from "./repositories/models-repository.js";
export { SettingsRepository } from "./repositories/settings-repository.js";
export {
  ApiKeysService,
  type ApiKeysServiceOptions,
  type IApiKeysService,
} from "./services/api-keys.service.js";
export {
  type ApplicationSecretPublic,
  ApplicationSecretsService,
  type ApplicationSecretsServiceOptions,
  type IApplicationSecretsService,
} from "./services/application-secrets.service.js";
export {
  AuditEventsService,
  type AuditEventsServiceOptions,
  type IAuditEventsService,
} from "./services/audit-events.service.js";
export {
  ModelAdminService,
  type ModelAdminServiceOptions,
} from "./services/model-admin.service.js";
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
export type {
  AppendAuditEventInput,
  Architecture,
  AuditActorRole,
  AuditActorType,
  AuditEventCursor,
  AuditEventDetail,
  AuditEventListDirection,
  AuditEventListInput,
  AuditEventListItem,
  AuditEventListResult,
  AuditEventRecord,
  AuditJson,
  AuditOutcome,
  AuditSource,
  DefaultParameters,
  Effort,
  HealthCheckPromptSetting,
  ModelConfig,
  ModelProxyModelRecord,
  ModelProxySettingRecord,
  ModelRoute,
  ModelRouteUpdate,
  ModelSyncDiffItem,
  ModelSyncSelection,
  ModelsWithConfigCounts,
  ModelsWithConfigResponse,
  NormalizedAuditEventListInput,
  PerRequestLimits,
  Pricing,
  Reasoning,
  RouteParams,
  RouterSettingsValue,
  SanitizedAuditEventInsert,
  SettingKey,
  SupportedParameters,
} from "./types/index.js";
export {
  AuditEventError,
  MODEL_ROUTE_TO_ROUTE_PARAM,
  normalizeSyncDirection,
  normalizeSyncPresenceStatus,
  RESERVED_ROUTE_PARAM_KEYS,
  ROUTE_PARAM_TO_MODEL_ROUTE,
  SETTING_KEYS,
} from "./types/index.js";
export { ModelAdminError } from "./types/model-admin.js";
export type {
  OpenAiOAuthAuthenticatedRequestConfig,
  OpenAiOAuthConnectionStatus,
  OpenAiOAuthConnectionTokens,
  OpenAiOAuthDeviceCodePollResult,
  OpenAiOAuthDeviceCodeStartResult,
  OpenAiOAuthEncryptedConnection,
} from "./types/openai-oauth.js";
export {
  OPENAI_CHATGPT_API_BASE,
  OPENAI_CHATGPT_AUTH_BASE,
  OPENAI_CHATGPT_CLIENT_ID,
  OPENAI_CHATGPT_DEVICE_CODE_URL,
  OPENAI_CHATGPT_DEVICE_TOKEN_URL,
  OPENAI_CHATGPT_DEVICE_VERIFY_URL,
  OPENAI_CHATGPT_OAUTH_TOKEN_URL,
} from "./types/openai-oauth.js";
