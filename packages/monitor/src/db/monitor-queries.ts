import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getMonitorDb } from "./monitor-client";
import type { Alert } from "./monitor-schema";
import { alerts, type NewAlert } from "./monitor-schema";

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
