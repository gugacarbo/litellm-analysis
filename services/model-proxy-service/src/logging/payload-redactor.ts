const SENSITIVE_HEADER_KEYS = new Set(["authorization", "x-api-key"]);

const API_KEY_PATTERN = /\bsk-[a-zA-Z0-9_-]{8,}\b/g;
const BEARER_PATTERN = /Bearer\s+[a-zA-Z0-9._-]+/gi;

const REDACTED = "[REDACTED]";

function redactString(value: string): string {
  return value
    .replace(API_KEY_PATTERN, REDACTED)
    .replace(BEARER_PATTERN, `Bearer ${REDACTED}`);
}

function redactValue(value: unknown): unknown {
  if (typeof value === "string") {
    return redactString(value);
  }

  if (Array.isArray(value)) {
    return value.map(redactValue);
  }

  if (typeof value === "object" && value !== null) {
    return redactObject(value as Record<string, unknown>);
  }

  return value;
}

function redactObject(value: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    const lower = key.toLowerCase();
    if (
      lower === "authorization" ||
      lower === "x-api-key" ||
      lower === "api_key" ||
      lower === "apikey"
    ) {
      result[key] = REDACTED;
      continue;
    }

    result[key] = redactValue(entry);
  }

  return result;
}

export function redactHeaders(
  headers: Headers | Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};

  if (headers instanceof Headers) {
    for (const [key, value] of headers.entries()) {
      if (SENSITIVE_HEADER_KEYS.has(key.toLowerCase())) {
        continue;
      }
      result[key] = redactString(value);
    }
    return result;
  }

  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADER_KEYS.has(key.toLowerCase())) {
      continue;
    }
    result[key] = redactString(value);
  }

  return result;
}

export function redactPayload(payload: unknown): unknown {
  if (payload === undefined || payload === null) {
    return payload;
  }

  if (typeof payload === "string") {
    try {
      return redactValue(JSON.parse(payload));
    } catch {
      return redactString(payload);
    }
  }

  return redactValue(payload);
}
