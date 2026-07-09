import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const modelProxyApiKeys = pgTable(
  "model_proxy_api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    label: text("label").notNull(),
    keyHash: text("key_hash").unique().notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_api_keys_enabled_label").on(table.enabled, table.label),
  ],
);

export type ModelProxyApiKey = typeof modelProxyApiKeys.$inferSelect;
export type NewModelProxyApiKey = typeof modelProxyApiKeys.$inferInsert;
