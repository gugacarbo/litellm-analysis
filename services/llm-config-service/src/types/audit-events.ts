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

/**
 * Provenance is intentionally held outside an append payload. The actual
 * values live in a module-private WeakMap, so a structurally similar object
 * (or a value cast in TypeScript) cannot become a trusted context.
 */
export interface AuditProvenance {
  actorType: NonNullable<AuditActorType>;
  actorId?: string | null;
  actorRole?: AuditActorRole;
  source: NonNullable<AuditSource>;
  requestId: string;
}

declare const trustedAuditContext: unique symbol;

export type TrustedAuditContext = {
  readonly [trustedAuditContext]: never;
};

const trustedAuditContexts = new WeakMap<object, Required<AuditProvenance>>();
const provenanceTextLimit = 256;

function invalidAuditEventInput(): never {
  throw new AuditEventError("VALIDATION", "Invalid audit event input");
}

function validProvenanceText(
  value: unknown,
  nullable = false,
): value is string | null {
  if (nullable && value === null) return true;
  return (
    typeof value === "string" &&
    value.length >= 1 &&
    value.length <= provenanceTextLimit
  );
}

/**
 * Mints a capability after an adapter has established the caller identity.
 * Consumers can pass the returned value to append, but cannot read, forge, or
 * mutate the provenance used by the writer.
 */
export function createTrustedAuditContext(
  provenance: AuditProvenance,
): TrustedAuditContext {
  if (
    !validProvenanceText(provenance.actorId ?? null, true) ||
    !validProvenanceText(provenance.requestId) ||
    !["user", "api_key", "system"].includes(provenance.actorType) ||
    !["ui", "legacy_api", "proxy", "system"].includes(provenance.source) ||
    (provenance.actorRole !== null &&
      provenance.actorRole !== undefined &&
      provenance.actorRole !== "admin" &&
      provenance.actorRole !== "viewer")
  ) {
    return invalidAuditEventInput();
  }

  const context = Object.freeze({});
  trustedAuditContexts.set(context, {
    actorType: provenance.actorType,
    actorId: provenance.actorId ?? null,
    actorRole: provenance.actorRole ?? null,
    source: provenance.source,
    requestId: provenance.requestId,
  });
  return context as TrustedAuditContext;
}

/** Internal writer boundary; deliberately not exported from the package API. */
export function resolveTrustedAuditContext(
  context: unknown,
): Required<AuditProvenance> {
  if (typeof context !== "object" || context === null) {
    return invalidAuditEventInput();
  }
  const provenance = trustedAuditContexts.get(context);
  if (!provenance) return invalidAuditEventInput();
  return provenance;
}

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
  context: TrustedAuditContext;
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
