#!/usr/bin/env node

/**
 * database/scripts/bootstrap-admin.ts
 *
 * Cria o primeiro convite de admin no banco a partir de AUTH_BOOTSTRAP_INVITE_SECRET.
 * O token gerado pode ser usado em /login?inviteToken=<token> para criar o primeiro admin.
 *
 * Uso:
 *   AUTH_BOOTSTRAP_INVITE_SECRET=meu-segredo node --experimental-strip-types database/scripts/bootstrap-admin.ts
 *
 * Exit codes:
 *   0 — convite criado ou já existente
 *   1 — erro
 */

import { createHash, randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { serverEnv } from "@lite-llm/config/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { appInvites } from "../src/schema/app/auth.ts";

function readSearchPath(connectionString: string): string | undefined {
  const schema = new URL(connectionString).searchParams.get("schema")?.trim();
  return schema || undefined;
}

async function main() {
  const bootstrapSecret = process.env.AUTH_BOOTSTRAP_INVITE_SECRET;
  if (!bootstrapSecret) {
    console.error(
      "AUTH_BOOTSTRAP_INVITE_SECRET environment variable is required",
    );
    process.exit(1);
  }

  const databaseUrl = serverEnv.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const searchPath = readSearchPath(databaseUrl);
  const pool = new Pool({
    connectionString: databaseUrl,
    ...(searchPath ? { options: `-c search_path=${searchPath},public` } : {}),
  });
  const db = drizzle(pool);

  // Ensure migrations are up to date
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)),
  });

  const tokenHash = createHash("sha256").update(bootstrapSecret).digest("hex");

  // Check if invite already exists
  const [existing] = await db
    .select({ id: appInvites.id })
    .from(appInvites)
    .where(
      and(
        eq(appInvites.tokenHash, tokenHash),
        isNull(appInvites.usedAt),
        gt(appInvites.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (existing) {
    console.log("✅ Bootstrap invite already exists and is valid");
    console.log(`   Invite URL: /login?inviteToken=${bootstrapSecret}`);
    await pool.end();
    process.exit(0);
  }

  // Create bootstrap invite (valid for 7 days)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(appInvites).values({
    id: randomBytes(16).toString("hex"),
    email: "",
    tokenHash,
    role: "admin",
    expiresAt,
  });

  console.log("✅ Bootstrap invite created successfully");
  console.log(`   Invite URL: /login?inviteToken=${bootstrapSecret}`);
  console.log(`   Expires: ${expiresAt.toISOString()}`);

  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
