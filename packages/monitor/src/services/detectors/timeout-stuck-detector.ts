import type { DetectorInput, DetectorResult } from "../monitor-types";

const COOLDOWN_SECONDS = 600; // 10 minutes
const LATENCY_MULTIPLIER_THRESHOLD = 3; // p95 > 3x normal indicates anomaly

export function detectTimeoutStuck(
  input: DetectorInput,
  isInCooldown: (
    anomalyType: string,
    model: string,
    cooldownSeconds: number,
  ) => boolean,
): DetectorResult[] {
  const results: DetectorResult[] = [];

  // Check for stuck requests
  if (input.stuckRequests.length > 0) {
    // Group stuck requests by model
    const stuckByModel = new Map<string, number>();
    for (const request of input.stuckRequests) {
      const model = request.model ?? "unknown";
      stuckByModel.set(model, (stuckByModel.get(model) ?? 0) + 1);
    }

    for (const [model, count] of stuckByModel) {
      if (isInCooldown("timeout_stuck", model, COOLDOWN_SECONDS)) {
        continue;
      }

      const health = input.modelHealthMap.get(model);
      const p95Latency = health?.p95_latency_ms;
      const avgLatency = health?.avg_latency_ms;

      let latencyInfo = "";
      if (p95Latency && avgLatency && avgLatency > 0) {
        const ratio = p95Latency / avgLatency;
        latencyInfo = `, p95 latency: ${p95Latency.toFixed(0)}ms (${ratio.toFixed(1)}x avg)`;
      }

      results.push({
        detected: true,
        alert: {
          anomaly_type: "timeout_stuck",
          model,
          severity: "warning",
          message: `${count} stuck/timed-out request(s) detected for model "${model}"${latencyInfo}`,
          metadata: {
            stuck_request_count: count,
            stuck_request_ids: input.stuckRequests
              .filter((r) => (r.model ?? "unknown") === model)
              .map((r) => r.request_id),
            p95_latency_ms: p95Latency,
            avg_latency_ms: avgLatency,
          },
        },
      });
    }
  }

  // Check for latency spikes (p95 > 3x normal)
  for (const [model, health] of input.modelHealthMap) {
    if (isInCooldown("timeout_stuck", model, COOLDOWN_SECONDS)) {
      continue;
    }

    const p95Latency = health.p95_latency_ms;
    const avgLatency = health.avg_latency_ms;

    // Check if p95 is significantly higher than average
    if (p95Latency && avgLatency && avgLatency > 0) {
      const ratio = p95Latency / avgLatency;

      if (ratio >= LATENCY_MULTIPLIER_THRESHOLD) {
        results.push({
          detected: true,
          alert: {
            anomaly_type: "timeout_stuck",
            model,
            severity: "warning",
            message: `High latency detected for model "${model}". p95: ${p95Latency.toFixed(0)}ms is ${ratio.toFixed(1)}x the average (${avgLatency.toFixed(0)}ms)`,
            metadata: {
              p95_latency_ms: p95Latency,
              avg_latency_ms: avgLatency,
              latency_ratio: ratio,
            },
          },
        });
      }
    }
  }

  return results;
}
