export class MissingProxyModelError extends Error {
  override readonly name = "MissingProxyModelError";

  constructor() {
    super("Missing required field: model");
  }
}

export function extractModelName(body: unknown): string | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return null;
  }

  const model = (body as Record<string, unknown>).model;
  if (typeof model !== "string") {
    return null;
  }

  const trimmed = model.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function injectUpstreamModel(
  body: unknown,
  upstreamModel: string,
): unknown {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return body;
  }

  return {
    ...(body as Record<string, unknown>),
    model: upstreamModel,
  };
}

export function isStreamingRequest(body: unknown): boolean {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return false;
  }

  return (body as Record<string, unknown>).stream === true;
}

export function extractEndUser(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return undefined;
  }

  const user = (body as Record<string, unknown>).user;
  return typeof user === "string" ? user : undefined;
}

export function extractLedgerMessages(
  body: unknown,
): Array<{ role: string; content: unknown }> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return [];
  }

  const record = body as Record<string, unknown>;
  if (Array.isArray(record.messages)) {
    return record.messages.flatMap((message) => {
      if (
        typeof message !== "object" ||
        message === null ||
        Array.isArray(message)
      ) {
        return [];
      }

      const entry = message as Record<string, unknown>;
      if (typeof entry.role !== "string") {
        return [];
      }

      return [{ role: entry.role, content: entry.content ?? message }];
    });
  }

  if (record.input !== undefined) {
    return inputToLedgerMessages(record.input);
  }

  return [];
}

function inputToLedgerMessages(
  input: unknown,
): Array<{ role: string; content: unknown }> {
  if (typeof input === "string") {
    return [{ role: "user", content: input }];
  }

  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((item) => {
    if (typeof item === "object" && item !== null && !Array.isArray(item)) {
      const record = item as Record<string, unknown>;
      if (record.type === "message" && typeof record.role === "string") {
        return {
          role: record.role,
          content: record.content ?? item,
        };
      }
    }
    return { role: "user", content: item };
  });
}
