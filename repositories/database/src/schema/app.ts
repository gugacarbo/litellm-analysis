import { doublePrecision, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  anomalyType: text("anomaly_type").notNull(),
  model: text("model"),
  severity: text("severity").notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  detectedAt: timestamp("detected_at").notNull(),
  acknowledgedAt: timestamp("acknowledged_at"),
  createdAt: timestamp("created_at").notNull(),
});

export const modelHealthChecks = pgTable("model_health_checks", {
  id: serial("id").primaryKey(),
  modelName: text("model_name").notNull(),
  status: text("status").notNull(),
  responseTimeMs: integer("response_time_ms"),
  ttftMs: integer("ttft_ms"),
  outputTokens: integer("output_tokens"),
  tokensPerSecond: doublePrecision("tokens_per_second"),
  statusCode: integer("status_code"),
  promptSent: text("prompt_sent").notNull(),
  responseReceived: text("response_received"),
  requestPayload: jsonb("request_payload"),
  responsePayload: jsonb("response_payload"),
  errorMessage: text("error_message"),
  source: text("source").default("scheduled").notNull(),
  checkedAt: timestamp("checked_at").notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
export type ModelHealthCheck = typeof modelHealthChecks.$inferSelect;
export type NewModelHealthCheck = typeof modelHealthChecks.$inferInsert;
