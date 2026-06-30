import {
  getModelProxyPrisma,
  type PrismaClient,
} from "@lite-llm/model-proxy-repository";
import {
  ApiKeysService,
  type IApiKeysService,
} from "./services/api-keys.service.js";
import {
  CredentialsService,
  type ICredentialsService,
} from "./services/credentials.service.js";
import {
  type IOpenAiOAuthService,
  OpenAiOAuthService,
} from "./services/openai-oauth.service.js";
import {
  type IRegistryModelsService,
  RegistryModelsService,
} from "./services/registry-models.service.js";
import {
  type ISettingsService,
  SettingsService,
} from "./services/settings.service.js";

export interface RegistryServices {
  prisma: PrismaClient;
  settingsService: ISettingsService;
  registryModelsService: IRegistryModelsService;
  credentialsService: ICredentialsService;
  apiKeysService: IApiKeysService;
  openAiOAuthService: IOpenAiOAuthService;
}

export interface CreateRegistryServicesOptions {
  prisma?: PrismaClient;
}

export function createRegistryServices(
  options: CreateRegistryServicesOptions = {},
): RegistryServices {
  const prisma = options.prisma ?? getModelProxyPrisma();

  return {
    prisma,
    settingsService: new SettingsService({ prisma }),
    registryModelsService: new RegistryModelsService({ prisma }),
    credentialsService: new CredentialsService({ prisma }),
    apiKeysService: new ApiKeysService({ prisma }),
    openAiOAuthService: new OpenAiOAuthService({ prisma }),
  };
}
