import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getMonitorDb } from "./monitor-client";
import type { Alert, ModelHealthCheck } from "./monitor-schema";
import {
  alerts,
  modelHealthChecks,
  type NewAlert,
  type NewModelHealthCheck,
} from "./monitor-schema";

export interface GetAlertsOptions {
  anomalyType?: string;
  model?: string;
  severity?: string;
  acknowledged?: boolean;
  limit?: number;
  offset?: number;
}

export interface GetAlertsResult {
  alerts: Alert[];
  total: number;
}

export function insertAlert(alert: NewAlert): Alert {
  const db = getMonitorDb();
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

export function getAlerts(opts: GetAlertsOptions = {}): GetAlertsResult {
  const db = getMonitorDb();
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
    .select({ count: sql<number>`count(*)` })
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

export function acknowledgeAlert(id: number): Alert | null {
  const db = getMonitorDb();
  const now = Math.floor(Date.now() / 1000);

  const result = db
    .update(alerts)
    .set({ acknowledgedAt: now })
    .where(eq(alerts.id, id))
    .returning()
    .get();

  return result;
}

export function getActiveAlerts(): Alert[] {
  const db = getMonitorDb();

  return db
    .select()
    .from(alerts)
    .where(isNull(alerts.acknowledgedAt))
    .orderBy(desc(alerts.detectedAt))
    .all();
}

export function countAlertsSince(timestamp: number): number {
  const db = getMonitorDb();

  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(alerts)
    .where(sql`${alerts.detectedAt} > ${timestamp}`)
    .get();

  return result?.count ?? 0;
}

export interface GetHealthChecksOptions {
  model?: string;
  limit?: number;
  offset?: number;
  since?: number;
}

export interface GetHealthChecksResult {
  checks: ModelHealthCheck[];
  total: number;
}

export function insertHealthCheck(
  check: NewModelHealthCheck,
): ModelHealthCheck {
  const db = getMonitorDb();
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

export function getHealthChecks(
  opts: GetHealthChecksOptions = {},
): GetHealthChecksResult {
  const db = getMonitorDb();
  const { model, limit = 50, offset = 0, since } = opts;

  const conditions = [];
  if (model) conditions.push(eq(modelHealthChecks.modelName, model));
  if (since) conditions.push(sql`${modelHealthChecks.checkedAt} >= ${since}`);

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const row = db
    .select({ count: sql<number>`count(*)` })
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

export function getLatestHealthChecks(): ModelHealthCheck[] {
  const db = getMonitorDb();

  const all = db
    .select()
    .from(modelHealthChecks)
    .orderBy(desc(modelHealthChecks.checkedAt))
    .all();

  const seen = new Set<string>();
  return all.filter((c) => {
    if (seen.has(c.modelName)) return false;
    seen.add(c.modelName);
    return true;
  });
}

export interface HealthCheckSummaryResult {
  healthy: number;
  unhealthy: number;
  error: number;
  total: number;
}

export function getHealthCheckSummary(): HealthCheckSummaryResult {
  const latest = getLatestHealthChecks();

  const summary: HealthCheckSummaryResult = {
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

export function cleanupOldHealthChecks(retentionDays: number): {
  deleted: number;
} {
  const db = getMonitorDb();
  const cutoff = Math.floor(Date.now() / 1000) - retentionDays * 86_400;

  const result = db
    .delete(modelHealthChecks)
    .where(sql`${modelHealthChecks.checkedAt} < ${cutoff}`)
    .run();

  return { deleted: result.changes };
}
