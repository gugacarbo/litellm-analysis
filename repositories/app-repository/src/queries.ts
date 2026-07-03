import { db } from "@lite-llm/database/client";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type {
  Alert,
  ModelHealthCheck,
  NewAlert,
  NewModelHealthCheck,
} from "./schema";
import { alerts, modelHealthChecks } from "./schema";

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

export async function insertAlert(alert: NewAlert): Promise<Alert> {
  const now = new Date();
  const createdAt = alert.createdAt ?? now;
  const detectedAt = alert.detectedAt ?? now;

  const result = await db
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
    .returning();

  return result[0];
}

export async function getAlerts(
  opts: GetAlertsOptions = {},
): Promise<GetAlertsResult> {
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

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(alerts)
    .where(whereClause);
  const total = Number(countRow?.count ?? 0);

  const alertRows = await db
    .select()
    .from(alerts)
    .where(whereClause)
    .orderBy(desc(alerts.detectedAt))
    .limit(limit)
    .offset(offset);

  return { alerts: alertRows, total };
}

export async function acknowledgeAlert(id: number): Promise<Alert | null> {
  const [result] = await db
    .update(alerts)
    .set({ acknowledgedAt: new Date() })
    .where(eq(alerts.id, id))
    .returning();

  return result ?? null;
}

export async function getActiveAlerts(): Promise<Alert[]> {
  return db
    .select()
    .from(alerts)
    .where(isNull(alerts.acknowledgedAt))
    .orderBy(desc(alerts.detectedAt));
}

export async function countAlertsSince(timestamp: Date): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(alerts)
    .where(sql`${alerts.detectedAt} > ${timestamp}`);

  return result?.count ?? 0;
}

export interface GetHealthChecksOptions {
  model?: string;
  limit?: number;
  offset?: number;
  since?: Date;
}

export interface GetHealthChecksResult {
  checks: ModelHealthCheck[];
  total: number;
}

export async function insertHealthCheck(
  check: NewModelHealthCheck,
): Promise<ModelHealthCheck> {
  const now = new Date();

  const [result] = await db
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
    .returning();

  return result;
}

export async function getHealthChecks(
  opts: GetHealthChecksOptions = {},
): Promise<GetHealthChecksResult> {
  const { model, limit = 50, offset = 0, since } = opts;

  const conditions = [];
  if (model) conditions.push(eq(modelHealthChecks.modelName, model));
  if (since) conditions.push(sql`${modelHealthChecks.checkedAt} >= ${since}`);

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(modelHealthChecks)
    .where(whereClause);
  const total = Number(countRow?.count ?? 0);

  const checks = await db
    .select()
    .from(modelHealthChecks)
    .where(whereClause)
    .orderBy(desc(modelHealthChecks.checkedAt))
    .limit(limit)
    .offset(offset);

  return { checks, total };
}

export async function getLatestHealthChecks(): Promise<ModelHealthCheck[]> {
  const latestSubquery = db
    .select({
      modelName: modelHealthChecks.modelName,
      maxCheckedAt: sql<Date>`max(${modelHealthChecks.checkedAt})`.as(
        "maxCheckedAt",
      ),
    })
    .from(modelHealthChecks)
    .groupBy(modelHealthChecks.modelName)
    .as("latest");

  const rows = await db
    .select()
    .from(modelHealthChecks)
    .innerJoin(
      latestSubquery,
      and(
        eq(modelHealthChecks.modelName, latestSubquery.modelName),
        eq(modelHealthChecks.checkedAt, latestSubquery.maxCheckedAt),
      ),
    )
    .orderBy(desc(modelHealthChecks.checkedAt));

  return rows.map((r) => r.model_health_checks);
}

export interface HealthCheckSummaryResult {
  healthy: number;
  unhealthy: number;
  error: number;
  total: number;
}

export async function getHealthCheckSummary(): Promise<HealthCheckSummaryResult> {
  const latest = await getLatestHealthChecks();

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

export async function cleanupOldHealthChecks(
  retentionDays: number,
): Promise<{ deleted: number }> {
  const cutoff = new Date(Date.now() - retentionDays * 86_400_000);

  const result = await db
    .delete(modelHealthChecks)
    .where(sql`${modelHealthChecks.checkedAt} < ${cutoff}`);

  return { deleted: result.rowCount ?? 0 };
}
