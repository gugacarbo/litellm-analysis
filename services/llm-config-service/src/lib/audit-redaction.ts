import { AuditEventError, type AuditJson } from "../types/audit-events.js";

export const REDACTED_AUDIT_VALUE = "[REDACTED]";

const sensitiveKeyParts = new Set([
  "authorization",
  "cookie",
  "setcookie",
  "xapikey",
  "apikey",
  "credentialenvelope",
  "accesstoken",
  "refreshtoken",
  "idtoken",
  "password",
  "secret",
  "token",
  "keyhash",
  "fingerprint",
  "iv",
  "tag",
]);

const credentialValuePattern =
  /\bbearer\s+[^\s,;]+|(?:^|[\s"'=,:])(?:sk|pk|rk|mp)_[A-Za-z0-9_-]{6,}|(?:^|[\s"'=,:])sk-[A-Za-z0-9_-]{6,}|AIza[A-Za-z0-9_-]{10,}|xox[baprs]-[A-Za-z0-9-]{8,}/iu;

function invalidAuditJson(): never {
  throw new AuditEventError("VALIDATION", "Invalid audit event input");
}

function isPlainObject(value: object): value is Record<string, unknown> {
  return Object.getPrototypeOf(value) === Object.prototype;
}

/**
 * Validates without serializing or coercing the value. The output is a fresh
 * object tree, so later redaction never mutates an application-owned input.
 */
export function assertAuditJson(value: unknown): asserts value is AuditJson {
  const visiting = new Set<object>();

  const visit = (candidate: unknown): void => {
    if (
      candidate === null ||
      typeof candidate === "boolean" ||
      typeof candidate === "string"
    ) {
      return;
    }
    if (typeof candidate === "number") {
      if (Number.isFinite(candidate)) return;
      invalidAuditJson();
    }
    if (typeof candidate !== "object" || candidate === null) {
      invalidAuditJson();
    }

    if (!Array.isArray(candidate) && !isPlainObject(candidate)) {
      invalidAuditJson();
    }
    if (visiting.has(candidate)) invalidAuditJson();
    visiting.add(candidate);
    for (const nested of Array.isArray(candidate)
      ? candidate
      : Object.values(candidate)) {
      visit(nested);
    }
    visiting.delete(candidate);
  };

  visit(value);
}

export function normalizeAuditKey(key: string): string {
  return key
    .normalize("NFKC")
    .toLocaleLowerCase("und")
    .replace(/[\s_-]/gu, "");
}

function isSensitiveKey(key: string): boolean {
  const normalized = normalizeAuditKey(key);
  return (
    sensitiveKeyParts.has(normalized) ||
    normalized.includes("secret") ||
    normalized.includes("token") ||
    normalized.includes("password") ||
    normalized.includes("fingerprint") ||
    normalized.includes("keyhash")
  );
}

function redact(value: AuditJson): AuditJson {
  if (typeof value === "string") {
    return credentialValuePattern.test(value) ? REDACTED_AUDIT_VALUE : value;
  }
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(redact);

  const output: Record<string, AuditJson> = {};
  for (const [key, nested] of Object.entries(value)) {
    Object.defineProperty(output, key, {
      configurable: true,
      enumerable: true,
      value: isSensitiveKey(key) ? REDACTED_AUDIT_VALUE : redact(nested),
      writable: true,
    });
  }
  return output;
}

export function redactAuditJson(value: unknown): AuditJson {
  assertAuditJson(value);
  return redact(value);
}
