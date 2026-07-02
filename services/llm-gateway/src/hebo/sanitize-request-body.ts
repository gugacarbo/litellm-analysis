export interface SanitizeHeboRequestBodyOptions {
  path?: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isResponsesPath(path: string | undefined): boolean {
  return path?.endsWith("/responses") ?? false;
}

function convertTextPartsToContent(
  parts: unknown,
): string | Array<Record<string, unknown>> {
  if (!Array.isArray(parts)) {
    return "";
  }

  const textParts = parts.filter(
    (part): part is Record<string, unknown> =>
      isPlainObject(part) &&
      part.type === "text" &&
      typeof part.text === "string",
  );

  if (textParts.length === 0) {
    return "";
  }

  if (textParts.length === 1) {
    return textParts[0]?.text as string;
  }

  return textParts.map((part) => ({
    type: "input_text",
    text: part.text,
  }));
}

function normalizeResponsesContent(
  content: unknown,
): string | Array<Record<string, unknown>> | unknown {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return content;
  }

  const textParts = content.filter(
    (part): part is Record<string, unknown> =>
      isPlainObject(part) && part.type === "text",
  );

  if (textParts.length !== content.length) {
    return content;
  }

  if (textParts.length === 1) {
    const text = textParts[0]?.text;
    return typeof text === "string" ? text : content;
  }

  return textParts.map((part) => ({
    type: "input_text",
    text: part.text,
  }));
}

function normalizeResponsesInputItem(item: unknown): unknown {
  if (!isPlainObject(item)) {
    return item;
  }

  if (typeof item.type === "string") {
    if (item.type !== "message" || item.content !== undefined || !item.parts) {
      return item;
    }

    const normalized: Record<string, unknown> = { ...item };
    normalized.content = convertTextPartsToContent(item.parts);
    delete normalized.parts;
    return normalized;
  }

  if (typeof item.role !== "string") {
    return item;
  }

  const normalized: Record<string, unknown> = {
    type: "message",
    role: item.role,
  };

  if (item.id !== undefined) {
    normalized.id = item.id;
  }

  if (item.content !== undefined) {
    normalized.content = normalizeResponsesContent(item.content);
  } else if (item.parts !== undefined) {
    normalized.content = convertTextPartsToContent(item.parts);
  }

  return normalized;
}

function normalizeResponsesInput(input: unknown): unknown {
  if (typeof input === "string") {
    return input;
  }

  if (!Array.isArray(input)) {
    return input;
  }

  return input.map((item) => normalizeResponsesInputItem(item));
}

function normalizeResponsesBody(body: Record<string, unknown>): void {
  if (body.input === undefined && Array.isArray(body.messages)) {
    body.input = body.messages;
    delete body.messages;
  }

  if (body.input !== undefined) {
    body.input = normalizeResponsesInput(body.input);
  }

  if (body.max_tokens !== undefined && body.max_output_tokens === undefined) {
    body.max_output_tokens = body.max_tokens;
    delete body.max_tokens;
  }
}

function hoistExtraBodyPrimitives(body: Record<string, unknown>): void {
  const extraBody = body.extra_body;
  if (!isPlainObject(extraBody)) {
    return;
  }

  const sanitizedExtra: Record<string, unknown> = { ...extraBody };
  for (const [key, value] of Object.entries(sanitizedExtra)) {
    if (isPlainObject(value)) {
      continue;
    }

    if (body[key] === undefined) {
      body[key] = value;
    }
    delete sanitizedExtra[key];
  }

  if (Object.keys(sanitizedExtra).length === 0) {
    delete body.extra_body;
  } else {
    body.extra_body = sanitizedExtra;
  }
}

/**
 * Normalizes client payloads before Hebo validates them.
 *
 * - Responses API: chat-style `messages` / `input` items are converted to
 *   Open Responses items (`type: "message"`, `content` instead of `parts`).
 * - All endpoints: primitive `extra_body` fields (e.g. MiniMax
 *   `reasoning_split`) are hoisted to the top level.
 */
export function sanitizeHeboRequestBody(
  body: unknown,
  options: SanitizeHeboRequestBodyOptions = {},
): unknown {
  if (!isPlainObject(body)) {
    return body;
  }

  const copy: Record<string, unknown> = { ...body };

  if (isResponsesPath(options.path)) {
    normalizeResponsesBody(copy);
  }

  hoistExtraBodyPrimitives(copy);

  return copy;
}
