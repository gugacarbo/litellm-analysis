import {
  getModelProxyPrisma,
  type PrismaClient,
} from "@lite-llm/model-proxy-repository";

export type { PrismaClient };

export interface RegistryClientOptions {
  prisma?: PrismaClient;
}

export function getRegistryPrisma(
  options: RegistryClientOptions = {},
): PrismaClient {
  return options.prisma ?? getModelProxyPrisma();
}
