import { createLogger, type Logger } from "@lite-llm/logger";

import type { Auth } from "@/features/auth/server/auth";

export type ServerContext = {
  auth: Auth;
  logger: ServerLogger;
};

export type ServerLogger = Logger;

export function createServerContext(params: { auth: Auth }): ServerContext {
  return {
    auth: params.auth,
    logger: createLogger({ consumer: "ui" }),
  };
}
