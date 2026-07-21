export class BenchmarkServiceError extends Error {
  constructor(
    readonly code:
      | "SNAPSHOT_NOT_FOUND"
      | "CREDENTIAL_NOT_CONFIGURED"
      | "UPSTREAM_UNAVAILABLE"
      | "UPSTREAM_RATE_LIMIT",
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
  }
}
