import { serverEnv } from "@lite-llm/env/server";
import { PrismaClient } from "./generated/prisma/index.js";

const DATABASE_URL = `postgresql://${serverEnv.DB_USER}:${serverEnv.DB_PASSWORD}@${serverEnv.DB_HOST}:${serverEnv.DB_PORT}/${serverEnv.DB_NAME}`;

export const prisma = new PrismaClient({
  datasourceUrl: DATABASE_URL,
});

export { PrismaClient };
