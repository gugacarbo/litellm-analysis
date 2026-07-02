import {
  getModelProxyPrisma,
  type PrismaClient,
} from "@lite-llm/model-proxy-repository";
import {
  ApiKeysService,
  type IApiKeysService,
} from "./services/api-keys.service.js";
import {
  ProvidersService,
  type IProvidersService,
} from "./services/providers.service.js";
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
  providersService: IProvidersService;
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
    providersService: new ProvidersService({ prisma }),
    apiKeysService: new ApiKeysService({ prisma }),
    openAiOAuthService: new OpenAiOAuthService({ prisma }),
  };
}
