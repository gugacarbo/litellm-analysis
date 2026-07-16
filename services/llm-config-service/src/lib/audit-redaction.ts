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
  /\bbearer(?:\s+[^\s,;]*)?|(?:^|[\s"'=,:])(?:sk|pk|rk|mp)[_-][A-Za-z0-9_-]*|AIza[A-Za-z0-9_-]*|xox[baprs]-[A-Za-z0-9-]*/iu;

function invalidAuditJson(): never {
  throw new AuditEventError("VALIDATION", "Invalid audit event input");
}

function isArrayIndex(key: string, length: number): boolean {
  const index = Number(key);
  return (
    Number.isInteger(index) &&
    index >= 0 &&
    index < length &&
    String(index) === key
  );
}

function descriptorsOf(
  value: object,
): Record<PropertyKey, PropertyDescriptor | undefined> {
  return Object.getOwnPropertyDescriptors(value) as Record<
    PropertyKey,
    PropertyDescriptor | undefined
  >;
}

function cloneAuditJson(value: unknown): AuditJson {
  const visiting = new Set<object>();

  const visit = (candidate: unknown): AuditJson => {
    if (
      candidate === null ||
      typeof candidate === "boolean" ||
      typeof candidate === "string"
    ) {
      return candidate;
    }
    if (typeof candidate === "number") {
      if (Number.isFinite(candidate)) return candidate;
      return invalidAuditJson();
    }
    if (typeof candidate !== "object" || candidate === null) {
      return invalidAuditJson();
    }

    if (visiting.has(candidate)) return invalidAuditJson();
    visiting.add(candidate);
    try {
      if (Array.isArray(candidate)) {
        if (Object.getPrototypeOf(candidate) !== Array.prototype) {
          return invalidAuditJson();
        }
        const descriptors = descriptorsOf(candidate);
        const keys = Reflect.ownKeys(descriptors);
        const lengthDescriptor = descriptors["length"];
        if (!lengthDescriptor || !("value" in lengthDescriptor)) {
          return invalidAuditJson();
        }
        const length = lengthDescriptor.value;
        if (
          typeof length !== "number" ||
          !Number.isSafeInteger(length) ||
          length < 0
        )
          return invalidAuditJson();
        for (const key of keys) {
          if (typeof key !== "string") return invalidAuditJson();
          if (key === "length") continue;
          const descriptor = descriptors[key];
          if (
            !descriptor?.enumerable ||
            !("value" in descriptor) ||
            !isArrayIndex(key, length)
          ) {
            return invalidAuditJson();
          }
        }
        const output: AuditJson[] = [];
        for (let index = 0; index < length; index += 1) {
          const descriptor = descriptors[String(index)];
          if (!descriptor || !("value" in descriptor))
            return invalidAuditJson();
          output.push(visit(descriptor.value));
        }
        return output;
      }

      if (Object.getPrototypeOf(candidate) !== Object.prototype) {
        return invalidAuditJson();
      }
      const descriptors = descriptorsOf(candidate);
      const output: Record<string, AuditJson> = {};
      for (const key of Reflect.ownKeys(descriptors)) {
        if (typeof key !== "string") return invalidAuditJson();
        const descriptor = descriptors[key];
        if (!descriptor?.enumerable || !("value" in descriptor)) {
          return invalidAuditJson();
        }
        Object.defineProperty(output, key, {
          configurable: true,
          enumerable: true,
          value: visit(descriptor.value),
          writable: true,
        });
      }
      return output;
    } finally {
      visiting.delete(candidate);
    }
  };

  try {
    return visit(value);
  } catch (error) {
    if (error instanceof AuditEventError) throw error;
    return invalidAuditJson();
  }
}

/**
 * Validates without serializing or coercing the value. The output is a fresh
 * object tree, so later redaction never mutates an application-owned input.
 */
export function assertAuditJson(value: unknown): asserts value is AuditJson {
  cloneAuditJson(value);
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
  return redact(cloneAuditJson(value));
}
