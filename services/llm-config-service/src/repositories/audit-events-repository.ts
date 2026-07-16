import type { db as drizzleDb } from "@lite-llm/database/client";
import { appAuditEvents } from "@lite-llm/database/schema";
import { and, asc, desc, eq, gt, gte, lt, lte, or } from "drizzle-orm";
import type {
  AuditEventRecord,
  NormalizedAuditEventListInput,
  SanitizedAuditEventInsert,
} from "../types/audit-events.js";
import {
  AuditEventError,
  createSanitizedAuditEventInsert,
  isSanitizedAuditEventInsert,
} from "../types/audit-events.js";

export interface AuditEventsRepositoryListResult {
  records: AuditEventRecord[];
  hasNewer: boolean;
  hasOlder: boolean;
}

export interface AuditEventsRepositoryPort {
  append(input: SanitizedAuditEventInsert): Promise<AuditEventRecord>;
  list(
    input: NormalizedAuditEventListInput,
  ): Promise<AuditEventsRepositoryListResult>;
  getPublicById(id: string): Promise<AuditEventRecord | null>;
}

function conditionsFor(input: NormalizedAuditEventListInput) {
  return [
    input.start ? gte(appAuditEvents.occurredAt, input.start) : undefined,
    input.end ? lte(appAuditEvents.occurredAt, input.end) : undefined,
    input.actorId ? eq(appAuditEvents.actorId, input.actorId) : undefined,
    input.action ? eq(appAuditEvents.action, input.action) : undefined,
    input.resourceType
      ? eq(appAuditEvents.resourceType, input.resourceType)
      : undefined,
    input.outcome ? eq(appAuditEvents.outcome, input.outcome) : undefined,
  ];
}

function olderThan(occurredAt: Date, id: string) {
  return or(
    lt(appAuditEvents.occurredAt, occurredAt),
    and(eq(appAuditEvents.occurredAt, occurredAt), lt(appAuditEvents.id, id)),
  );
}

function newerThan(occurredAt: Date, id: string) {
  return or(
    gt(appAuditEvents.occurredAt, occurredAt),
    and(eq(appAuditEvents.occurredAt, occurredAt), gt(appAuditEvents.id, id)),
  );
}

export class AuditEventsRepository implements AuditEventsRepositoryPort {
  private readonly db: typeof drizzleDb;

  constructor(db: typeof drizzleDb) {
    this.db = db;
  }

  async append(input: SanitizedAuditEventInsert): Promise<AuditEventRecord> {
    if (!isSanitizedAuditEventInsert(input)) {
      throw new AuditEventError("VALIDATION", "Invalid audit event input");
    }
    const sanitized = createSanitizedAuditEventInsert(input);
    const [record] = await this.db
      .insert(appAuditEvents)
      .values(sanitized)
      .returning();
    return record;
  }

  async list(
    input: NormalizedAuditEventListInput,
  ): Promise<AuditEventsRepositoryListResult> {
    const base = conditionsFor(input);
    const cursor = input.cursor;
    const directionCondition = cursor
      ? input.direction === "newer"
        ? newerThan(new Date(cursor.occurredAt), cursor.id)
        : olderThan(new Date(cursor.occurredAt), cursor.id)
      : undefined;
    const rows = await this.db
      .select()
      .from(appAuditEvents)
      .where(and(...base, directionCondition))
      .orderBy(
        input.direction === "newer"
          ? asc(appAuditEvents.occurredAt)
          : desc(appAuditEvents.occurredAt),
        input.direction === "newer"
          ? asc(appAuditEvents.id)
          : desc(appAuditEvents.id),
      )
      .limit(input.pageSize + 1);
    const selected = rows.slice(0, input.pageSize);
    const records = input.direction === "newer" ? selected.reverse() : selected;
    const first = records[0];
    const last = records.at(-1);
    const [newerProbe, olderProbe] = await Promise.all([
      first
        ? this.db
            .select({ id: appAuditEvents.id })
            .from(appAuditEvents)
            .where(and(...base, newerThan(first.occurredAt, first.id)))
            .limit(1)
        : Promise.resolve([]),
      last
        ? this.db
            .select({ id: appAuditEvents.id })
            .from(appAuditEvents)
            .where(and(...base, olderThan(last.occurredAt, last.id)))
            .limit(1)
        : Promise.resolve([]),
    ]);
    return {
      records,
      hasNewer: newerProbe.length > 0,
      hasOlder: olderProbe.length > 0,
    };
  }

  async getPublicById(id: string): Promise<AuditEventRecord | null> {
    const [record] = await this.db
      .select()
      .from(appAuditEvents)
      .where(eq(appAuditEvents.id, id))
      .limit(1);
    return record ?? null;
  }
}
