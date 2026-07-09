import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const modelProxyProviders = pgTable("model_proxy_providers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").unique().notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  provider: text("provider"),
  baseUrl: text("base_url"),
  apiKey: text("api_key"),
  secretRef: text("secret_ref"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type ModelProxyProvider = typeof modelProxyProviders.$inferSelect;
export type NewModelProxyProvider = typeof modelProxyProviders.$inferInsert;
