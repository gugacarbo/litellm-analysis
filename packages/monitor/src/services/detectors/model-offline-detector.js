const COOLDOWN_SECONDS = 600; // 10 minutes
const LOOKBACK_MS = 15 * 60 * 1000; // 15 minutes
export function detectModelOffline(input, isInCooldown) {
  const now = Date.now();
  const lookbackTime = new Date(now - LOOKBACK_MS);
  // Get models that have had requests in the last 2 hours
  const activeModels = new Set();
  // Add models from recent errors
  for (const error of input.recentErrors) {
    const model = error.model ?? error.litellm_model_name;
    if (model) {
      activeModels.add(model);
    }
  }
  // Add models from health map
  for (const model of input.modelHealthMap.keys()) {
    activeModels.add(model);
  }
  for (const model of activeModels) {
    // Skip if in cooldown
    if (isInCooldown("model_offline", model, COOLDOWN_SECONDS)) {
      continue;
    }
    const health = input.modelHealthMap.get(model);
    if (!health) {
      continue;
    }
    // Check if model has 0 successful requests AND at least 1 failure in last 15 min
    const recentErrorsForModel = input.recentErrors.filter(
      (e) =>
        (e.model ?? e.litellm_model_name) === model &&
        new Date(e.timestamp) >= lookbackTime,
    );
    const hasRecentFailure = recentErrorsForModel.length > 0;
    const hasRecentSuccess = health.last_success_at
      ? new Date(health.last_success_at) >= lookbackTime
      : false;
    // Model is offline if no recent success AND at least 1 recent failure
    if (!hasRecentSuccess && hasRecentFailure) {
      const errorMessages = recentErrorsForModel
        .slice(0, 3)
        .map((e) => e.error_message ?? e.error_type ?? "Unknown error")
        .join("; ");
      return {
        detected: true,
        alert: {
          anomaly_type: "model_offline",
          model,
          severity: "critical",
          message: `Model "${model}" appears to be offline. Recent failures: ${errorMessages}`,
          metadata: {
            recent_failure_count: recentErrorsForModel.length,
            last_error_at: recentErrorsForModel[0]?.timestamp ?? null,
            last_success_at: health.last_success_at,
          },
        },
      };
    }
  }
  return { detected: false };
}
