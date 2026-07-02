import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

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

export const promptEvalRuns = pgTable("prompt_eval_runs", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  model: text("model").notNull(),
  macroF1: doublePrecision("macro_f1"),
  threshold: doublePrecision("threshold").notNull(),
  error: text("error"),
  startedAt: timestamp("started_at").notNull(),
  finishedAt: timestamp("finished_at"),
});

export const promptEvalRunSteps = pgTable("prompt_eval_run_steps", {
  id: serial("id").primaryKey(),
  runId: text("run_id").notNull().references(() => promptEvalRuns.id),
  step: text("step").notNull(),
  status: text("status").notNull(),
  startedAt: timestamp("started_at").notNull(),
  finishedAt: timestamp("finished_at"),
  message: text("message"),
  progressPct: integer("progress_pct").default(0).notNull(),
});

export const promptEvalRunArtifacts = pgTable("prompt_eval_run_artifacts", {
  id: serial("id").primaryKey(),
  runId: text("run_id").notNull().references(() => promptEvalRuns.id),
  kind: text("kind").notNull(),
  path: text("path").notNull(),
  summaryJson: jsonb("summary_json"),
});

export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
export type AlertRule = typeof alertRules.$inferSelect;
export type NewAlertRule = typeof alertRules.$inferInsert;
export type ModelHealthCheck = typeof modelHealthChecks.$inferSelect;
export type NewModelHealthCheck = typeof modelHealthChecks.$inferInsert;
export type EvalRun = typeof promptEvalRuns.$inferSelect;
export type NewEvalRun = typeof promptEvalRuns.$inferInsert;
export type EvalRunStep = typeof promptEvalRunSteps.$inferSelect;
export type NewEvalRunStep = typeof promptEvalRunSteps.$inferInsert;
export type EvalRunArtifact = typeof promptEvalRunArtifacts.$inferSelect;
export type NewEvalRunArtifact = typeof promptEvalRunArtifacts.$inferInsert;
