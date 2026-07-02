import { getDb, type DatabaseClient } from "@lite-llm/database/client";
import {
  ApiKeysService,
  type IApiKeysService,
} from "./services/api-keys.service.js";
import {
  type IOpenAiOAuthService,
  OpenAiOAuthService,
} from "./services/openai-oauth.service.js";
import {
  type IProvidersService,
  ProvidersService,
} from "./services/providers.service.js";
import {
  type IRegistryModelsService,
  RegistryModelsService,
} from "./services/registry-models.service.js";
import {
  type ISettingsService,
  SettingsService,
} from "./services/settings.service.js";

export interface RegistryServices {
  prisma: DatabaseClient;
  settingsService: ISettingsService;
  registryModelsService: IRegistryModelsService;
  providersService: IProvidersService;
  apiKeysService: IApiKeysService;
  openAiOAuthService: IOpenAiOAuthService;
}

export interface CreateRegistryServicesOptions {
  prisma?: DatabaseClient;
}

export function createRegistryServices(
  options: CreateRegistryServicesOptions = {},
): RegistryServices {
  const prisma = options.prisma ?? getDb();

  return {
    prisma,
    settingsService: new SettingsService({ prisma }),
    registryModelsService: new RegistryModelsService({ prisma }),
    providersService: new ProvidersService({ prisma }),
    apiKeysService: new ApiKeysService({ prisma }),
    openAiOAuthService: new OpenAiOAuthService({ prisma }),
  };
}
