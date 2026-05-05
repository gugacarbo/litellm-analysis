import type { DetectorInput, DetectorResult } from "../monitor-types";

const COOLDOWN_SECONDS = 300;
const SPIKE_RATIO_THRESHOLD = 3;
const MIN_NON_SUCCESS_FOR_SPIKE = 5;

export function detectNonSuccessSpike(
  input: DetectorInput,
  isInCooldown: (
    anomalyType: string,
    model: string,
    cooldownSeconds: number,
  ) => boolean,
): DetectorResult[] {
  const results: DetectorResult[] = [];

  for (const entry of input.nonSuccessCountsByModel) {
    const { model, non_success_count } = entry;

    if (
      isInCooldown("non_success_spike", model, COOLDOWN_SECONDS) ||
      non_success_count < MIN_NON_SUCCESS_FOR_SPIKE
    ) {
      continue;
    }

    const health = input.modelHealthMap.get(model);
    if (!health) {
      continue;
    }

    const totalRequests = health.total_requests;

    // Extrapolate to hourly rate: non_success_count is from a 5-min polling window
    // (assumes monitor service ticks every 5 minutes)
    const currentHourlyRate = non_success_count * 12;

    // Calculate historical non-success rate for baseline comparison
    // Compare current rate against historical rate using same data source (spendLogs)
    const historicalNonSuccessRate =
      totalRequests > 0
        ? (health.error_count / totalRequests) * 60
        : 0;
    const spikeRatio =
      historicalNonSuccessRate > 0
        ? currentHourlyRate / historicalNonSuccessRate
        : currentHourlyRate;

    if (spikeRatio >= SPIKE_RATIO_THRESHOLD) {
      const nonSuccessRate =
        totalRequests > 0
          ? ((non_success_count / totalRequests) * 100).toFixed(1)
          : "0.0";

      results.push({
        detected: true,
        alert: {
          anomaly_type: "non_success_spike",
          model,
          severity: "warning",
          message:
            `Non-success spike detected for model "${model}". ` +
            `${non_success_count} non-success request(s) in window ` +
            `(${nonSuccessRate}% of requests), ` +
            `baseline: ${historicalNonSuccessRate.toFixed(1)}/hour ` +
            `(${spikeRatio.toFixed(1)}x increase)`,
          metadata: {
            non_success_count_window: non_success_count,
            non_success_rate_pct: Number(nonSuccessRate),
            baseline_hourly_rate: historicalNonSuccessRate,
            current_hourly_rate: currentHourlyRate,
            spike_ratio: spikeRatio,
            total_requests_window: totalRequests,
          },
        },
      });
    }
  }

  return results;
}
