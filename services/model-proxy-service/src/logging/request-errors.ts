export const DEFAULT_REQUEST_TIMEOUT_MS = 120_000;

export interface StructuredError {
  details?: unknown;
  message: string;
  statusCode?: number;
  type: string;
}

export function trimErrorMessage(message: string, maxLength = 500): string {
  return message.length > maxLength ? message.slice(0, maxLength) : message;
}

export function createUpstreamHttpError(
  statusCode: number,
  message: string,
  details?: unknown,
): StructuredError {
  return {
    type: "upstream_http_error",
    message: trimErrorMessage(message),
    statusCode,
    details,
  };
}

export function createUpstreamNetworkError(
  message: string,
  details?: unknown,
): StructuredError {
  return {
    type: "upstream_network_error",
    message: trimErrorMessage(message),
    details,
  };
}

export function createTimeoutError(): StructuredError {
  return {
    type: "timeout",
    message: "Upstream request timed out",
  };
}

export function createParseError(message: string): StructuredError {
  return {
    type: "parse_error",
    message: trimErrorMessage(message),
  };
}

export function createCancelledError(
  message = "Request cancelled",
): StructuredError {
  return {
    type: "cancelled",
    message: trimErrorMessage(message),
  };
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.message.includes("timed out"))
  );
}

export function mergeAbortSignals(
  ...signals: Array<AbortSignal | undefined>
): AbortSignal {
  const active = signals.filter((signal): signal is AbortSignal => !!signal);
  if (active.length === 0) {
    return AbortSignal.timeout(DEFAULT_REQUEST_TIMEOUT_MS);
  }

  if (active.length === 1) {
    return active[0];
  }

  const controller = new AbortController();
  const onAbort = () => {
    controller.abort(
      active.find((signal) => signal.reason)?.reason ??
        new DOMException("The operation was aborted.", "AbortError"),
    );
  };

  for (const signal of active) {
    if (signal.aborted) {
      onAbort();
      break;
    }
    signal.addEventListener("abort", onAbort, { once: true });
  }

  return controller.signal;
}

export function createRequestAbortSignal(
  signal?: AbortSignal,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): AbortSignal {
  return mergeAbortSignals(signal, AbortSignal.timeout(timeoutMs));
}
