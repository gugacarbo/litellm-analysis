import { createDbRepository } from "@lite-llm/agents-repository/db-repository";
import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";

export function createRepositoryClient(): IAgentsRepository {
  return createDbRepository({ validateOnRead: false });
}
