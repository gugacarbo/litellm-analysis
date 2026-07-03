import { type DatabaseClient, getDb } from "@lite-llm/database/client";

export interface RegistryClientOptions {
  prisma?: DatabaseClient;
}

export function getRegistryPrisma(
  options: RegistryClientOptions = {},
): DatabaseClient {
  return options.prisma ?? getDb();
}
