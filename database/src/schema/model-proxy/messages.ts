import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { modelProxyRequests } from "./requests";

export const modelProxyMessages = pgTable(
  "model_proxy_messages",
  {
    id: text("id").primaryKey(),
    requestId: text("request_id")
      .notNull()
      .references(() => modelProxyRequests.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: jsonb("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_messages_request_created").on(table.requestId, table.createdAt),
  ],
);

export type ModelProxyMessage = typeof modelProxyMessages.$inferSelect;
export type NewModelProxyMessage = typeof modelProxyMessages.$inferInsert;
