import { sql } from "drizzle-orm";
import { check, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { modelProxyTable } from "./model-proxy/table";

export const applicationSecretsStore = modelProxyTable(
  "application_secrets_store",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull(),
    credentialEnvelope: text("credential_envelope").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("uq_application_secrets_store_key").on(table.key),
    check(
      "ck_application_secrets_store_key_allowlist",
      sql`${table.key} IN ('artificial_analysis_api_key', 'openrouter_api_key') OR ${table.key} ~ '^provider:[0-9a-fA-F-]{36}$'`,
    ),
  ],
);

export type ApplicationSecret = typeof applicationSecretsStore.$inferSelect;
export type NewApplicationSecret = typeof applicationSecretsStore.$inferInsert;
