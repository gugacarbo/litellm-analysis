import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
