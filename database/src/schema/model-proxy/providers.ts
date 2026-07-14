import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const modelProxyProviders = pgTable(
  "model_proxy_providers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").unique().notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    provider: text("provider"),
    baseUrl: text("base_url"),
    credentialEnvelope: text("credential_envelope"),
    revision: integer("revision").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("uq_model_proxy_providers_single_default")
      .on(table.isDefault)
      .where(sql`${table.isDefault} = true`),
  ],
);

export type ModelProxyProvider = typeof modelProxyProviders.$inferSelect;
export type NewModelProxyProvider = typeof modelProxyProviders.$inferInsert;
