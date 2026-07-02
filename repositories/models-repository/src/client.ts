import {
  createDbRepository,
  type DbModelsRepositoryOptions,
} from "./db-repository";
import type { IModelsRepository } from "./interfaces";

export type { IModelsRepository };
export type RepositoryOptions = DbModelsRepositoryOptions;
export type RepositoryClientOptions = DbModelsRepositoryOptions;

export function createRepositoryClient(
  options: RepositoryClientOptions = {},
): IModelsRepository {
  return createDbRepository({
    ...options,
    validateOnRead: options.validateOnRead ?? false,
  });
}
