import type { DetectorInput, DetectorResult } from "../monitor-types";

const COOLDOWN_SECONDS = 300; // 5 minutes
const SPIKE_THRESHOLD = 3; // current rate must be 3x baseline
const MIN_ERRORS_FOR_SPIKE = 5; // need at least 5 errors in 5 min to consider spike

export function detectErrorSpike(
  input: DetectorInput,
  isInCooldown: (
    anomalyType: string,
    model: string,
    cooldownSeconds: number,
  ) => boolean,
): DetectorResult[] {
  const results: DetectorResult[] = [];

  for (const errorCountEntry of input.errorCountsByModel) {
    const { model, error_count: recentErrorCount } = errorCountEntry;

    // Skip if in cooldown
    if (isInCooldown("error_spike", model, COOLDOWN_SECONDS)) {
      continue;
    }

    // Need at least 5 errors in last 5 min to check for spike
    if (recentErrorCount < MIN_ERRORS_FOR_SPIKE) {
      continue;
    }

    // Get health stats for baseline calculation
    const health = input.modelHealthMap.get(model);
    if (!health) {
      continue;
    }

    // Calculate baseline: average errors per hour from last 1 hour
    // Use total error count as proxy for hourly rate
    const hourlyErrorRate = health.error_count;

    // Current rate: errors in last 5 min extrapolated to hourly
    const currentHourlyRate = (recentErrorCount / 5) * 60;

    // Calculate spike ratio
    const spikeRatio =
      hourlyErrorRate > 0 ? currentHourlyRate / hourlyErrorRate : 0;

    if (spikeRatio >= SPIKE_THRESHOLD) {
      results.push({
        detected: true,
        alert: {
          anomaly_type: "error_spike",
          model,
          severity: "critical",
          message: `Error spike detected for model "${model}". Current rate: ${currentHourlyRate.toFixed(1)} errors/hour, baseline: ${hourlyErrorRate.toFixed(1)} errors/hour (${spikeRatio.toFixed(1)}x increase)`,
          metadata: {
            recent_error_count_5min: recentErrorCount,
            baseline_hourly_rate: hourlyErrorRate,
            current_hourly_rate: currentHourlyRate,
            spike_ratio: spikeRatio,
          },
        },
      });
    }
  }

  return results;
}
