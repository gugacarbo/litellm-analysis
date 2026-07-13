import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { getDb } from "@lite-llm/database/client";
import {
  account,
  appInvites,
  session,
  user,
  verification,
} from "@lite-llm/database/schema/app";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export type Auth = {
  handler: (request: Request) => Promise<Response>;
  db: NodePgDatabase<Record<string, unknown>>;
  options: { secret: string };
};

export function createAuth(params: {
  db: NodePgDatabase<Record<string, unknown>>;
  secret: string;
}): Auth {
  const { db, secret } = params;

  const baseURL =
    process.env.BETTER_AUTH_URL ??
    process.env.VITE_APP_URL ??
    "http://localhost:5178";
  const trustedOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const instance = betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user,
        session,
        account,
        verification,
        appInvites,
      },
    }),
    databaseType: "postgres",
    secret,
    baseURL,
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
    },
    plugins: [admin({ defaultRole: "viewer" }), tanstackStartCookies()],
  });

  return {
    handler: instance.handler,
    db,
    options: { secret },
  };
}

// Singleton para uso em runtime (rota catch-all, server functions)
let _auth: Auth | null = null;

export function getAuth(): Auth {
  if (!_auth) {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      throw new Error("AUTH_SECRET environment variable is required");
    }
    _auth = createAuth({ db: getDb(), secret });
  }
  return _auth;
}

export const auth = new Proxy(
  {},
  {
    get(_target, prop: keyof Auth) {
      return getAuth()[prop];
    },
  },
) as Auth;
