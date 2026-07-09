import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { modelProxyProviders } from "./providers";

export const modelProxyReasoningApis = pgTable("model_proxy_reasoning_apis", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").unique().notNull(),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => modelProxyProviders.id, { onDelete: "cascade" }),
  version: text("version").notNull(),
  requestParams: jsonb("request_params"),
  requestShape: jsonb("request_shape"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type ModelProxyReasoningApi =
  typeof modelProxyReasoningApis.$inferSelect;
export type NewModelProxyReasoningApi =
  typeof modelProxyReasoningApis.$inferInsert;
