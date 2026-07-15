export { createRepositoryClient } from "./client";

import type { DbModelsRepositoryOptions } from "./db-repository";

export type RepositoryClientOptions = DbModelsRepositoryOptions;
export type RepositoryOptions = DbModelsRepositoryOptions;

export type {
  IModelsRepository,
  ModelSpec,
  ModelsConfig,
  Provider,
} from "./index";
