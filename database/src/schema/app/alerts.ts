import { jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

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

export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
