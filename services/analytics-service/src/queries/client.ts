import { createRequire } from "node:module";
import type { PrismaClient } from "@lite-llm/litellm-repository/client";

const require = createRequire(import.meta.url);

let cachedPrisma: PrismaClient | null = null;

function getLitellmPrisma(): PrismaClient {
  if (!cachedPrisma) {
    const client = require("@lite-llm/litellm-repository/client") as {
      prisma: PrismaClient;
    };
    cachedPrisma = client.prisma;
  }
  return cachedPrisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    return Reflect.get(getLitellmPrisma(), property, receiver);
  },
});

export type { PrismaClient };
