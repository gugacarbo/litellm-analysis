import { serverEnv } from "@lite-llm/config/server";
import { Prisma, PrismaClient } from "./generated/prisma/index";

function getDatabaseUrl(): string {
  const explicit = serverEnv.MODEL_PROXY_DATABASE_URL?.trim();
  if (explicit) {
    return explicit;
  }

  throw new Error(
    "MODEL_PROXY_DATABASE_URL is required to use @lite-llm/model-proxy-repository",
  );
}

let prismaInstance: PrismaClient | null = null;

export function getModelProxyPrisma(): PrismaClient {
  prismaInstance ??= new PrismaClient({
    datasourceUrl: getDatabaseUrl(),
  });

  return prismaInstance;
}

export async function disconnectModelProxyPrisma(): Promise<void> {
  if (!prismaInstance) {
    return;
  }

  await prismaInstance.$disconnect();
  prismaInstance = null;
}

export { PrismaClient };
export { Prisma };
