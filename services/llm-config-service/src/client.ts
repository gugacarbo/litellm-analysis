import { type DatabaseClient, getDb } from "@lite-llm/database/client";

export interface RegistryClientOptions {
  db?: DatabaseClient;
}

export function getRegistryDb(
  options: RegistryClientOptions = {},
): DatabaseClient {
  return options.db ?? getDb();
}
