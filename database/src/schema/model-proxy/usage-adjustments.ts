import {
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { modelProxyRequests } from "./requests";

export const modelProxyUsageAdjustments = pgTable(
  "model_proxy_usage_adjustments",
  {
    id: text("id").primaryKey(),
    requestId: text("request_id")
      .notNull()
      .references(() => modelProxyRequests.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    promptTokensDelta: integer("prompt_tokens_delta").default(0).notNull(),
    completionTokensDelta: integer("completion_tokens_delta")
      .default(0)
      .notNull(),
    totalCostDelta: doublePrecision("total_cost_delta").default(0).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_usage_adjustments_request_created").on(
      table.requestId,
      table.createdAt,
    ),
  ],
);

export type ModelProxyUsageAdjustment =
  typeof modelProxyUsageAdjustments.$inferSelect;
export type NewModelProxyUsageAdjustment =
  typeof modelProxyUsageAdjustments.$inferInsert;
