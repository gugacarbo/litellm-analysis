import { type DatabaseClient, getDb } from "@lite-llm/database/client";
import {
  ApiKeysService,
  type IApiKeysService,
} from "./services/api-keys.service.js";
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
  db: DatabaseClient;
  settingsService: ISettingsService;
  registryModelsService: IRegistryModelsService;
  apiKeysService: IApiKeysService;
  openAiOAuthService: IOpenAiOAuthService;
}

export interface CreateRegistryServicesOptions {
  db?: DatabaseClient;
}

export function createRegistryServices(
  options: CreateRegistryServicesOptions = {},
): RegistryServices {
  const db = options.db ?? getDb();

  return {
    db,
    settingsService: new SettingsService({ db }),
    registryModelsService: new RegistryModelsService({ db }),
    apiKeysService: new ApiKeysService({ db }),
    openAiOAuthService: new OpenAiOAuthService({ db }),
  };
}
