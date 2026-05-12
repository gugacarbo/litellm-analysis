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

// --- Prompt Eval tables ---

export const promptEvalRuns = sqliteTable("prompt_eval_runs", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  model: text("model").notNull(),
  macroF1: real("macro_f1"),
  threshold: real("threshold").notNull(),
  error: text("error"),
  startedAt: integer("started_at").notNull(),
  finishedAt: integer("finished_at"),
});

export const promptEvalRunSteps = sqliteTable("prompt_eval_run_steps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  runId: text("run_id")
    .notNull()
    .references(() => promptEvalRuns.id),
  step: text("step").notNull(),
  status: text("status").notNull(),
  startedAt: integer("started_at").notNull(),
  finishedAt: integer("finished_at"),
  message: text("message"),
  progressPct: integer("progress_pct").notNull().default(0),
});

export const promptEvalRunArtifacts = sqliteTable("prompt_eval_run_artifacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  runId: text("run_id")
    .notNull()
    .references(() => promptEvalRuns.id),
  kind: text("kind").notNull(),
  path: text("path").notNull(),
  summaryJson: text("summary_json"),
});

export type EvalRun = typeof promptEvalRuns.$inferSelect;
export type NewEvalRun = typeof promptEvalRuns.$inferInsert;
export type EvalRunStep = typeof promptEvalRunSteps.$inferSelect;
export type NewEvalRunStep = typeof promptEvalRunSteps.$inferInsert;
export type EvalRunArtifact = typeof promptEvalRunArtifacts.$inferSelect;
export type NewEvalRunArtifact = typeof promptEvalRunArtifacts.$inferInsert;
