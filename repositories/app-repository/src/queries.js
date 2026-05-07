import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getAppDb } from "./client.js";
import { alerts, modelHealthChecks } from "./schema.js";
export function insertAlert(alert) {
  const db = getAppDb();
  const now = Math.floor(Date.now() / 1000);
  const createdAt = alert.createdAt ?? now;
  const detectedAt = alert.detectedAt ?? now;
  const result = db
    .insert(alerts)
    .values({
      anomalyType: alert.anomalyType,
      model: alert.model,
      severity: alert.severity,
      message: alert.message,
      metadata: alert.metadata,
      detectedAt: detectedAt,
      acknowledgedAt: alert.acknowledgedAt,
      createdAt: createdAt,
    })
    .returning()
    .get();
  return result;
}
export function getAlerts(opts = {}) {
  const db = getAppDb();
  const {
    anomalyType,
    model,
    severity,
    acknowledged,
    limit = 50,
    offset = 0,
  } = opts;
  const conditions = [];
  if (anomalyType) {
    conditions.push(eq(alerts.anomalyType, anomalyType));
  }
  if (model) {
    conditions.push(eq(alerts.model, model));
  }
  if (severity) {
    conditions.push(eq(alerts.severity, severity));
  }
  if (acknowledged !== undefined) {
    if (acknowledged) {
      conditions.push(sql`${alerts.acknowledgedAt} IS NOT NULL`);
    } else {
      conditions.push(isNull(alerts.acknowledgedAt));
    }
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const row = db
    .select({ count: sql`count(*)` })
    .from(alerts)
    .where(whereClause)
    .get();
  const total = row?.count ?? 0;
  const alertRows = db
    .select()
    .from(alerts)
    .where(whereClause)
    .orderBy(desc(alerts.detectedAt))
    .limit(limit)
    .offset(offset)
    .all();
  return { alerts: alertRows, total };
}
export function acknowledgeAlert(id) {
  const db = getAppDb();
  const now = Math.floor(Date.now() / 1000);
  const result = db
    .update(alerts)
    .set({ acknowledgedAt: now })
    .where(eq(alerts.id, id))
    .returning()
    .get();
  return result;
}
export function getActiveAlerts() {
  const db = getAppDb();
  return db
    .select()
    .from(alerts)
    .where(isNull(alerts.acknowledgedAt))
    .orderBy(desc(alerts.detectedAt))
    .all();
}
export function countAlertsSince(timestamp) {
  const db = getAppDb();
  const result = db
    .select({ count: sql`count(*)` })
    .from(alerts)
    .where(sql`${alerts.detectedAt} > ${timestamp}`)
    .get();
  return result?.count ?? 0;
}
export function insertHealthCheck(check) {
  const db = getAppDb();
  const now = Math.floor(Date.now() / 1000);
  return db
    .insert(modelHealthChecks)
    .values({
      modelName: check.modelName,
      status: check.status,
      responseTimeMs: check.responseTimeMs,
      ttftMs: check.ttftMs,
      outputTokens: check.outputTokens,
      tokensPerSecond: check.tokensPerSecond,
      statusCode: check.statusCode,
      promptSent: check.promptSent,
      responseReceived: check.responseReceived,
      requestPayload: check.requestPayload,
      responsePayload: check.responsePayload,
      errorMessage: check.errorMessage,
      source: check.source ?? "scheduled",
      checkedAt: check.checkedAt ?? now,
    })
    .returning()
    .get();
}
export function getHealthChecks(opts = {}) {
  const db = getAppDb();
  const { model, limit = 50, offset = 0, since } = opts;
  const conditions = [];
  if (model) conditions.push(eq(modelHealthChecks.modelName, model));
  if (since) conditions.push(sql`${modelHealthChecks.checkedAt} >= ${since}`);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const row = db
    .select({ count: sql`count(*)` })
    .from(modelHealthChecks)
    .where(whereClause)
    .get();
  const total = row?.count ?? 0;
  const checks = db
    .select()
    .from(modelHealthChecks)
    .where(whereClause)
    .orderBy(desc(modelHealthChecks.checkedAt))
    .limit(limit)
    .offset(offset)
    .all();
  return { checks, total };
}
export function getLatestHealthChecks() {
  const db = getAppDb();
  const latestSubquery = db
    .select({
      modelName: modelHealthChecks.modelName,
      maxCheckedAt: sql`max(${modelHealthChecks.checkedAt})`.as("maxCheckedAt"),
    })
    .from(modelHealthChecks)
    .groupBy(modelHealthChecks.modelName)
    .as("latest");
  const rows = db
    .select()
    .from(modelHealthChecks)
    .innerJoin(
      latestSubquery,
      and(
        eq(modelHealthChecks.modelName, latestSubquery.modelName),
        eq(modelHealthChecks.checkedAt, latestSubquery.maxCheckedAt),
      ),
    )
    .orderBy(desc(modelHealthChecks.checkedAt))
    .all();
  return rows.map((r) => r.model_health_checks);
}
export function getHealthCheckSummary() {
  const latest = getLatestHealthChecks();
  const summary = {
    healthy: 0,
    unhealthy: 0,
    error: 0,
    total: latest.length,
  };
  for (const check of latest) {
    if (check.status === "healthy") summary.healthy++;
    else if (check.status === "unhealthy") summary.unhealthy++;
    else summary.error++;
  }
  return summary;
}
export function cleanupOldHealthChecks(retentionDays) {
  const db = getAppDb();
  const cutoff = Math.floor(Date.now() / 1000) - retentionDays * 86_400;
  const result = db
    .delete(modelHealthChecks)
    .where(sql`${modelHealthChecks.checkedAt} < ${cutoff}`)
    .run();
  return { deleted: result.changes };
}
