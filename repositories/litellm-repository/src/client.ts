import { serverEnv } from "@lite-llm/config/server";
import { PrismaClient } from "./generated/prisma/index";

function buildLitellmDatabaseUrl(): string {
  const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = serverEnv;
  if (
    !DB_USER ||
    !DB_PASSWORD ||
    !DB_HOST ||
    DB_PORT === undefined ||
    !DB_NAME
  ) {
    throw new Error(
      "DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD are required to use @lite-llm/litellm-repository",
    );
  }

  return `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
}

const DATABASE_URL = buildLitellmDatabaseUrl();

export const prisma = new PrismaClient({
  datasourceUrl: DATABASE_URL,
});

export { PrismaClient };
