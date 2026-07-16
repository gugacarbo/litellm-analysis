import type { DatabaseClient } from "@lite-llm/database/client";
import { redactAuditJson } from "../lib/audit-redaction.js";
import {
  AuditEventsRepository,
  type AuditEventsRepositoryPort,
} from "../repositories/audit-events-repository.js";
import type {
  AppendAuditEventInput,
  AuditEventCursor,
  AuditEventDetail,
  AuditEventListInput,
  AuditEventListItem,
  AuditEventListResult,
  AuditEventRecord,
  AuditJson,
  NormalizedAuditEventListInput,
  SanitizedAuditEventInsert,
} from "../types/audit-events.js";
import {
  AuditEventError,
  createSanitizedAuditEventInsert,
  resolveTrustedAuditContext,
} from "../types/audit-events.js";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const isoDatePattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/u;
const textLimit = 256;

export interface AuditEventsServiceOptions {
  db?: DatabaseClient;
  repository?: AuditEventsRepositoryPort;
}

export interface IAuditEventsService {
  append(input: AppendAuditEventInput): Promise<AuditEventListItem>;
  list(input?: AuditEventListInput): Promise<AuditEventListResult>;
  getPublicById(id: string): Promise<AuditEventDetail>;
}

function validationError(): never {
  throw new AuditEventError("VALIDATION", "Invalid audit event input");
}

function validText(value: unknown, nullable = false): value is string | null {
  if (nullable && value === null) return true;
  return (
    typeof value === "string" && value.length >= 1 && value.length <= textLimit
  );
}

function asIsoDate(value: unknown): Date {
  if (typeof value !== "string") {
    return validationError();
  }
  const match = isoDatePattern.exec(value);
  if (!match) return validationError();
  const [, year, month, day, hour, minute, second, offset] = match;
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  const hourNumber = Number(hour);
  const minuteNumber = Number(minute);
  const secondNumber = Number(second);
  const daysInMonth = new Date(
    Date.UTC(yearNumber, monthNumber, 0),
  ).getUTCDate();
  if (
    monthNumber < 1 ||
    monthNumber > 12 ||
    dayNumber < 1 ||
    dayNumber > daysInMonth ||
    hourNumber > 23 ||
    minuteNumber > 59 ||
    secondNumber > 59 ||
    (offset !== "Z" &&
      (Number(offset.slice(1, 3)) > 23 || Number(offset.slice(4, 6)) > 59))
  ) {
    return validationError();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return validationError();
  return date;
}

function encodeCursor(record: AuditEventRecord): string {
  return Buffer.from(
    JSON.stringify({
      v: 1,
      occurredAt: record.occurredAt.toISOString(),
      id: record.id,
    } satisfies AuditEventCursor),
  ).toString("base64url");
}

function decodeCursor(value: unknown): AuditEventCursor {
  if (typeof value !== "string" || value.length === 0) return validationError();
  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return validationError();
  }
  if (
    typeof decoded !== "object" ||
    decoded === null ||
    Object.getPrototypeOf(decoded) !== Object.prototype ||
    Object.keys(decoded).length !== 3
  ) {
    return validationError();
  }
  const cursor = decoded as Record<string, unknown>;
  if (
    cursor.v !== 1 ||
    !uuidPattern.test(String(cursor.id)) ||
    typeof cursor.occurredAt !== "string"
  ) {
    return validationError();
  }
  asIsoDate(cursor.occurredAt);
  return { v: 1, occurredAt: cursor.occurredAt, id: cursor.id as string };
}

function normalizeListInput(
  input: AuditEventListInput = {},
): NormalizedAuditEventListInput {
  const start = input.start === undefined ? undefined : asIsoDate(input.start);
  const end = input.end === undefined ? undefined : asIsoDate(input.end);
  if (start && end && start > end) validationError();

  for (const value of [input.actorId, input.action, input.resourceType]) {
    if (value !== undefined && !validText(value)) validationError();
  }
  if (
    input.outcome !== undefined &&
    input.outcome !== "success" &&
    input.outcome !== "failure" &&
    input.outcome !== "denied"
  ) {
    validationError();
  }
  if (
    input.direction !== undefined &&
    input.direction !== "older" &&
    input.direction !== "newer"
  ) {
    validationError();
  }
  if (
    input.pageSize !== undefined &&
    (!Number.isInteger(input.pageSize) ||
      input.pageSize < 1 ||
      input.pageSize > 100)
  ) {
    validationError();
  }
  if ((input.direction === undefined) !== (input.cursor === undefined))
    validationError();

  return {
    start,
    end,
    actorId: input.actorId,
    action: input.action,
    resourceType: input.resourceType,
    outcome: input.outcome,
    cursor: input.cursor === undefined ? undefined : decodeCursor(input.cursor),
    direction: input.direction,
    pageSize: input.pageSize ?? 50,
  };
}

function listItem(record: AuditEventRecord): AuditEventListItem {
  return {
    id: record.id,
    occurredAt: record.occurredAt,
    actorType: record.actorType,
    actorId: record.actorId,
    actorRole: record.actorRole,
    source: record.source,
    requestId: record.requestId,
    action: record.action,
    resourceType: record.resourceType,
    resourceId: record.resourceId,
    outcome: record.outcome,
  };
}

function detail(record: AuditEventRecord): AuditEventDetail {
  return {
    ...listItem(record),
    before: record.before === null ? null : redactAuditJson(record.before),
    after: record.after === null ? null : redactAuditJson(record.after),
    metadata:
      record.metadata === null ? null : redactAuditJson(record.metadata),
  };
}

function validatedSnapshot(
  input: AppendAuditEventInput,
  key: "before" | "after" | "metadata",
): AuditJson | null {
  if (!Object.hasOwn(input, key)) return null;
  return redactAuditJson(input[key]);
}

function toInsert(input: AppendAuditEventInput): SanitizedAuditEventInsert {
  const provenance = resolveTrustedAuditContext(input.context);
  if (
    !validText(input.action) ||
    !validText(input.resourceType) ||
    !validText(input.resourceId ?? null, true) ||
    !["success", "failure", "denied"].includes(input.outcome)
  ) {
    return validationError();
  }

  return createSanitizedAuditEventInsert({
    actorType: provenance.actorType,
    actorId: provenance.actorId,
    actorRole: provenance.actorRole,
    source: provenance.source,
    requestId: provenance.requestId,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId ?? null,
    outcome: input.outcome,
    before: validatedSnapshot(input, "before"),
    after: validatedSnapshot(input, "after"),
    metadata: validatedSnapshot(input, "metadata"),
  });
}

export class AuditEventsService implements IAuditEventsService {
  private repository?: AuditEventsRepositoryPort;
  private readonly db?: DatabaseClient;

  constructor(options: AuditEventsServiceOptions = {}) {
    this.repository = options.repository;
    this.db = options.db;
  }

  private getRepository(): AuditEventsRepositoryPort {
    if (this.repository) return this.repository;
    if (!this.db) {
      throw new Error("AuditEventsService requires db or repository");
    }
    this.repository = new AuditEventsRepository(this.db);
    return this.repository;
  }

  async append(input: AppendAuditEventInput): Promise<AuditEventListItem> {
    const record = await this.getRepository().append(toInsert(input));
    return listItem(record);
  }

  async list(input: AuditEventListInput = {}): Promise<AuditEventListResult> {
    const normalized = normalizeListInput(input);
    const result = await this.getRepository().list(normalized);
    const first = result.records[0];
    const last = result.records.at(-1);
    return {
      events: result.records.map(listItem),
      olderCursor: last && result.hasOlder ? encodeCursor(last) : null,
      newerCursor: first && result.hasNewer ? encodeCursor(first) : null,
    };
  }

  async getPublicById(id: string): Promise<AuditEventDetail> {
    if (!uuidPattern.test(id)) validationError();
    const record = await this.getRepository().getPublicById(id);
    if (!record) {
      throw new AuditEventError("NOT_FOUND", "Audit event not found");
    }
    return detail(record);
  }
}
