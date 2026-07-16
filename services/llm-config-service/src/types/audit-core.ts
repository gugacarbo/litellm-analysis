/**
 * Values that may be persisted in an audit JSONB snapshot. Runtime validation
 * lives in audit-redaction; this module intentionally has no dependencies so
 * the error/type contract can be shared without an ESM import cycle.
 */
export type AuditJson =
  | null
  | boolean
  | number
  | string
  | AuditJson[]
  | { [key: string]: AuditJson };

export class AuditEventError extends Error {
  constructor(
    readonly code: "VALIDATION" | "NOT_FOUND",
    message: "Invalid audit event input" | "Audit event not found",
  ) {
    super(message);
    this.name = "AuditEventError";
  }
}
