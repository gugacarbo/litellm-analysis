import type {
  AppAuditEvent,
  NewAppAuditEvent,
} from "@lite-llm/database/schema";
import { redactAuditJson } from "../lib/audit-redaction.js";

/** JSON accepted for audit snapshots. It deliberately excludes Date and other
 * runtime values that would otherwise be coerced by JSON.stringify. */
export type AuditJson =
  | null
  | boolean
  | number
  | string
  | AuditJson[]
  | { [key: string]: AuditJson };

export type AuditActorType = AppAuditEvent["actorType"];
export type AuditActorRole = AppAuditEvent["actorRole"];
export type AuditSource = AppAuditEvent["source"];
export type AuditOutcome = AppAuditEvent["outcome"];
export type AuditEventRecord = AppAuditEvent;
export type SanitizedAuditEventInsert = Omit<
  NewAppAuditEvent,
  "before" | "after" | "metadata"
> & {
  before: AuditJson | null;
  after: AuditJson | null;
  metadata: AuditJson | null;
};

export type AuditEventInsertCandidate = Omit<
  NewAppAuditEvent,
  "before" | "after" | "metadata"
> & {
  before: unknown;
  after: unknown;
  metadata: unknown;
};

const sanitizedAuditEventInserts = new WeakSet<object>();

export function createSanitizedAuditEventInsert(
  input: AuditEventInsertCandidate,
): SanitizedAuditEventInsert {
  const sanitized: SanitizedAuditEventInsert = {
    ...input,
    before: redactAuditSnapshot(input.before),
    after: redactAuditSnapshot(input.after),
    metadata: redactAuditSnapshot(input.metadata),
  };
  sanitizedAuditEventInserts.add(sanitized);
  return sanitized;
}

export function isSanitizedAuditEventInsert(
  input: unknown,
): input is SanitizedAuditEventInsert {
  return (
    typeof input === "object" &&
    input !== null &&
    sanitizedAuditEventInserts.has(input)
  );
}

function redactAuditSnapshot(value: unknown): AuditJson | null {
  if (value === null) return null;
  return redactAuditJson(value);
}

export interface AppendAuditEventInput {
  actorType: NonNullable<AuditActorType>;
  actorId?: string | null;
  actorRole?: AuditActorRole;
  source: NonNullable<AuditSource>;
  requestId: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  outcome: NonNullable<AuditOutcome>;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
}

export type AuditEventListDirection = "older" | "newer";

export interface AuditEventListInput {
  start?: string;
  end?: string;
  actorId?: string;
  action?: string;
  resourceType?: string;
  outcome?: NonNullable<AuditOutcome>;
  cursor?: string;
  direction?: AuditEventListDirection;
  pageSize?: number;
}

export interface AuditEventCursor {
  v: 1;
  occurredAt: string;
  id: string;
}

export interface NormalizedAuditEventListInput {
  start?: Date;
  end?: Date;
  actorId?: string;
  action?: string;
  resourceType?: string;
  outcome?: NonNullable<AuditOutcome>;
  cursor?: AuditEventCursor;
  direction?: AuditEventListDirection;
  pageSize: number;
}

export interface AuditEventListItem {
  id: string;
  occurredAt: Date;
  actorType: NonNullable<AuditActorType>;
  actorId: string | null;
  actorRole: AuditActorRole;
  source: NonNullable<AuditSource>;
  requestId: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  outcome: NonNullable<AuditOutcome>;
}

export interface AuditEventDetail extends AuditEventListItem {
  before: AuditJson | null;
  after: AuditJson | null;
  metadata: AuditJson | null;
}

export interface AuditEventListResult {
  events: AuditEventListItem[];
  olderCursor: string | null;
  newerCursor: string | null;
}

export class AuditEventError extends Error {
  constructor(
    readonly code: "VALIDATION" | "NOT_FOUND",
    message: "Invalid audit event input" | "Audit event not found",
  ) {
    super(message);
    this.name = "AuditEventError";
  }
}
