import type { DetectorInput, DetectorResult } from "../monitor-types";

const COOLDOWN_SECONDS = 300; // 5 minutes
const LOOKBACK_MS = 5 * 60 * 1000; // 5 minutes
const MIN_SILENT_FAILURES = 3; // threshold for alert

// Known failure types that are explicitly handled
const KNOWN_FAILURE_TYPES = new Set([
  "rate_limit_error",
  "timeout_error",
  "authentication_error",
  "permission_error",
  "invalid_request_error",
  "BadRequestError",
  "RateLimitError",
  "AuthenticationError",
  "TimeoutError",
  "APITimeoutError",
  "ServiceUnavailableError",
  "InternalServerError",
  "BadGatewayError",
  "GatewayTimeoutError",
  "ReadTimeout",
  "ConnectTimeout",
  "ConnectionError",
  "context_length_exceeded",
  "tokens_exceeded",
  "model_quota_exceeded",
]);

// Known success statuses
const SUCCESS_STATUSES = new Set([
  "success",
  "completed",
  "ok",
  "200",
  "200 OK",
]);

export function detectSilentFailure(
  input: DetectorInput,
  isInCooldown: (
    anomalyType: string,
    model: string,
    cooldownSeconds: number,
  ) => boolean,
): DetectorResult[] {
  const results: DetectorResult[] = [];
  const now = Date.now();
  const lookbackTime = new Date(now - LOOKBACK_MS);

  // Group recent errors by model
  const errorsByModel = new Map<
    string,
    import("@lite-llm/analytics-service/types").ErrorLogEntry[]
  >();

  for (const error of input.recentErrors) {
    const errorTime = new Date(error.timestamp);
    if (errorTime < lookbackTime) {
      continue;
    }

    const model = error.model ?? error.litellm_model_name ?? "unknown";
    if (!errorsByModel.has(model)) {
      errorsByModel.set(model, []);
    }
    errorsByModel.get(model)?.push(error);
  }

  // Check each model for silent failures
  for (const [model, errors] of errorsByModel) {
    if (isInCooldown("silent_failure", model, COOLDOWN_SECONDS)) {
      continue;
    }

    // Filter for silent failures:
    // - status != 'success' AND status not in known failure types
    // - OR status is missing/null with no error_type
    const silentFailures = errors.filter((error) => {
      // If status exists and is a known success, not a silent failure
      if (
        error.error_type &&
        SUCCESS_STATUSES.has(error.error_type.toLowerCase())
      ) {
        return false;
      }

      // If error_type exists and is a known failure type, not silent
      if (error.error_type && KNOWN_FAILURE_TYPES.has(error.error_type)) {
        return false;
      }

      // If error_type exists but is generic/unknown, could be silent
      if (error.error_type) {
        const lowerType = error.error_type.toLowerCase();
        if (
          lowerType.includes("error") ||
          lowerType.includes("exception") ||
          lowerType === "unknown" ||
          lowerType === "generic"
        ) {
          // Generic error could be silent failure
          return true;
        }
        // Non-generic unknown error type
        return false;
      }

      // No error_type but has error_message - might be silent
      if (error.error_message) {
        return true;
      }

      // No identifiable error type
      return false;
    });

    if (silentFailures.length >= MIN_SILENT_FAILURES) {
      const errorMessages = silentFailures
        .slice(0, 5)
        .map((e) => e.error_message ?? e.error_type ?? "Unknown")
        .filter(Boolean);

      results.push({
        detected: true,
        alert: {
          anomaly_type: "silent_failure",
          model,
          severity: "warning",
          message: `Silent failures detected for model "${model}". ${silentFailures.length} request(s) failed with unclear/unknown error types`,
          metadata: {
            silent_failure_count: silentFailures.length,
            sample_errors: errorMessages,
          },
        },
      });
    }
  }

  return results;
}
