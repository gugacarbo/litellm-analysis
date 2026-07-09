import * as path from "node:path";

export function parseConfigContent(content: string, filePath: string): unknown {
  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === ".jsonc") {
      return JSON.parse(normalizeJsonc(content));
    }

    return JSON.parse(content);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown parse error";
    throw new Error(`Failed to parse ${filePath}: ${message}`);
  }
}

function normalizeJsonc(input: string): string {
  const withoutComments = stripJsonComments(input);
  return removeTrailingCommas(withoutComments);
}

function stripJsonComments(input: string): string {
  let out = "";
  let i = 0;
  let inString = false;
  let escaped = false;

  while (i < input.length) {
    const current = input[i];
    const next = input[i + 1];

    if (inString) {
      out += current;
      if (escaped) {
        escaped = false;
      } else if (current === "\\") {
        escaped = true;
      } else if (current === '"') {
        inString = false;
      }
      i += 1;
      continue;
    }

    if (current === '"') {
      inString = true;
      out += current;
      i += 1;
      continue;
    }

    if (current === "/" && next === "/") {
      i += 2;
      while (i < input.length && input[i] !== "\n") {
        i += 1;
      }
      continue;
    }

    if (current === "/" && next === "*") {
      i += 2;
      while (i < input.length - 1) {
        if (input[i] === "*" && input[i + 1] === "/") {
          i += 2;
          break;
        }
        i += 1;
      }
      continue;
    }

    out += current;
    i += 1;
  }

  return out;
}

function removeTrailingCommas(input: string): string {
  let out = "";
  let i = 0;
  let inString = false;
  let escaped = false;

  while (i < input.length) {
    const current = input[i];

    if (inString) {
      out += current;
      if (escaped) {
        escaped = false;
      } else if (current === "\\") {
        escaped = true;
      } else if (current === '"') {
        inString = false;
      }
      i += 1;
      continue;
    }

    if (current === '"') {
      inString = true;
      out += current;
      i += 1;
      continue;
    }

    if (current === ",") {
      let j = i + 1;
      while (j < input.length && /\s/.test(input[j])) {
        j += 1;
      }

      if (input[j] === "}" || input[j] === "]") {
        i += 1;
        continue;
      }
    }

    out += current;
    i += 1;
  }

  return out;
}

export function normalizeConfig(config: unknown): unknown {
  if (!isRecord(config)) {
    return config;
  }

  return config;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
