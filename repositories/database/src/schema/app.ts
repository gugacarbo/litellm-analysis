import { boolean, doublePrecision, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

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

export const alertRules = pgTable("alert_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  anomalyType: text("anomaly_type").notNull(),
  thresholdConfig: jsonb("threshold_config"),
  enabled: boolean("enabled").default(true).notNull(),
  cooldownSeconds: integer("cooldown_seconds").default(300).notNull(),
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
export type AlertRule = typeof alertRules.$inferSelect;
export type NewAlertRule = typeof alertRules.$inferInsert;
export type ModelHealthCheck = typeof modelHealthChecks.$inferSelect;
export type NewModelHealthCheck = typeof modelHealthChecks.$inferInsert;
