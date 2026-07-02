import type { LogArgs, Logger } from "@hebo-ai/gateway";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAbortErrorLike(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === "AbortError";
  }

  if (!isRecord(error)) {
    return false;
  }

  return error.name === "AbortError";
}

export function isExpectedAbortWarningLog(args: LogArgs): boolean {
  const [first] = args;

  if (isAbortErrorLike(first)) {
    return true;
  }

  if (!isRecord(first)) {
    return false;
  }

  return isAbortErrorLike(first.err);
}

function serializeError(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) {
    return { message: String(error) };
  }

  const serialized: Record<string, unknown> = {};
  for (const key of Object.getOwnPropertyNames(error)) {
    const value = error[key as keyof Error];
    serialized[key] =
      typeof value === "bigint" ? `${value.toString()}n` : value;
  }

  if (!("name" in serialized)) {
    serialized.name = error.name;
  }
  if (!("message" in serialized)) {
    serialized.message = error.message;
  }

  return serialized;
}

function buildLogEntry(level: keyof Logger, args: LogArgs): string {
  const [first, second] = args;
  const entry: Record<string, unknown> = {
    level,
    time: Date.now(),
  };

  if (typeof first === "string") {
    entry.msg = first;
  } else if (first instanceof Error) {
    entry.err = serializeError(first);
    entry.msg = second ?? first.message;
  } else if (isRecord(first)) {
    for (const [key, value] of Object.entries(first)) {
      entry[key] = key === "err" ? serializeError(value) : value;
    }
    if (second) {
      entry.msg = second;
    }
  }

  return JSON.stringify(entry);
}

function createLogMethod(level: keyof Logger): Logger[keyof Logger] {
  return (...args) => {
    if (level === "warn" && isExpectedAbortWarningLog(args)) {
      return;
    }

    console.log(buildLogEntry(level, args));
  };
}

export function createHeboLogger(): Logger {
  return {
    trace: createLogMethod("trace"),
    debug: createLogMethod("debug"),
    info: createLogMethod("info"),
    warn: createLogMethod("warn"),
    error: createLogMethod("error"),
  };
}
