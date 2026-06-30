import { createDbRepository } from "@lite-llm/agents-repository/db-repository";
import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";

export interface RepositoryClientOptions {
  agentsFilePath?: string;
  pluginsFilePath?: string;
}

export function createRepositoryClient(
  _options: RepositoryClientOptions = {},
): IAgentsRepository {
  return createDbRepository({ validateOnRead: false });
}
