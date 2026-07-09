import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const modelProxySettings = pgTable("model_proxy_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").unique().notNull(),
  value: jsonb("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type ModelProxySetting = typeof modelProxySettings.$inferSelect;
export type NewModelProxySetting = typeof modelProxySettings.$inferInsert;
