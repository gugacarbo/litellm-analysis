import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const alerts = sqliteTable("alerts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  anomalyType: text("anomaly_type").notNull(),
  model: text("model"),
  severity: text("severity").notNull(),
  message: text("message").notNull(),
  metadata: text("metadata"),
  detectedAt: integer("detected_at").notNull(),
  acknowledgedAt: integer("acknowledged_at"),
  createdAt: integer("created_at").notNull(),
});

export const alertRules = sqliteTable("alert_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  anomalyType: text("anomaly_type").notNull(),
  thresholdConfig: text("threshold_config"),
  enabled: integer("enabled").notNull().default(1),
  cooldownSeconds: integer("cooldown_seconds").notNull().default(300),
  createdAt: integer("created_at").notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
export type AlertRule = typeof alertRules.$inferSelect;
export type NewAlertRule = typeof alertRules.$inferInsert;

export const modelHealthChecks = sqliteTable("model_health_checks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  modelName: text("model_name").notNull(),
  status: text("status").notNull(),
  responseTimeMs: integer("response_time_ms"),
  ttftMs: integer("ttft_ms"),
  outputTokens: integer("output_tokens"),
  tokensPerSecond: real("tokens_per_second"),
  statusCode: integer("status_code"),
  promptSent: text("prompt_sent").notNull(),
  responseReceived: text("response_received"),
  requestPayload: text("request_payload"),
  responsePayload: text("response_payload"),
  errorMessage: text("error_message"),
  source: text("source").notNull().default("scheduled"),
  checkedAt: integer("checked_at").notNull(),
});

export type ModelHealthCheck = typeof modelHealthChecks.$inferSelect;
export type NewModelHealthCheck = typeof modelHealthChecks.$inferInsert;
