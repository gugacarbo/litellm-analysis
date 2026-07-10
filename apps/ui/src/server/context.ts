import type { Auth } from "./auth/auth";

export type ServerContext = {
  auth: Auth;
  logger: ServerLogger;
};

export type ServerLogger = {
  info: (event: string, meta?: Record<string, unknown>) => void;
  error: (event: string, meta?: Record<string, unknown>) => void;
};

export function createServerContext(params: { auth: Auth }): ServerContext {
  return {
    auth: params.auth,
    logger: createLogger(),
  };
}

function createLogger(): ServerLogger {
  return {
    info: (event, meta) => {
      const entry = {
        level: "info",
        event,
        timestamp: new Date().toISOString(),
        ...meta,
      };
      console.log(JSON.stringify(entry));
    },
    error: (event, meta) => {
      const entry = {
        level: "error",
        event,
        timestamp: new Date().toISOString(),
        ...meta,
      };
      console.error(JSON.stringify(entry));
    },
  };
}
