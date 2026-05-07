import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { getMonitorDb } from "../../db/monitor-client";
import { alerts } from "../../db/monitor-schema";
import { detectErrorSpike } from "./error-spike-detector";
import { detectModelOffline } from "./model-offline-detector";
import { detectNonSuccessSpike } from "./non-success-spike-detector";
import { detectSilentFailure } from "./silent-failure-detector";
import { detectTimeoutStuck } from "./timeout-stuck-detector";

function isInCooldown(anomalyType, model, cooldownSeconds) {
  try {
    const alertDb = getMonitorDb();
    const cutoff = Math.floor(Date.now() / 1000) - cooldownSeconds;
    const result = alertDb
      .select({ count: sql`count(*)` })
      .from(alerts)
      .where(
        and(
          eq(alerts.anomalyType, anomalyType),
          model ? eq(alerts.model, model) : sql`${alerts.model} IS NULL`,
          gte(alerts.detectedAt, cutoff),
          isNull(alerts.acknowledgedAt),
        ),
      )
      .get();
    return (result?.count ?? 0) > 0;
  } catch {
    // If we can't check cooldown, assume we're not in cooldown
    return false;
  }
}
export function runAllDetectors(input) {
  const results = [];
  // Run each detector wrapped in try/catch
  // Model offline detector
  try {
    const result = detectModelOffline(input, isInCooldown);
    if (result.detected) {
      results.push(result);
    }
  } catch (err) {
    console.error("[Detectors] model_offline detector failed:", err);
  }
  // Error spike detector
  try {
    const spikeResults = detectErrorSpike(input, isInCooldown);
    results.push(...spikeResults);
  } catch (err) {
    console.error("[Detectors] error_spike detector failed:", err);
  }
  // Timeout/stuck detector
  try {
    const timeoutResults = detectTimeoutStuck(input, isInCooldown);
    results.push(...timeoutResults);
  } catch (err) {
    console.error("[Detectors] timeout_stuck detector failed:", err);
  }
  try {
    const nonSuccessResults = detectNonSuccessSpike(input, isInCooldown);
    results.push(...nonSuccessResults);
  } catch (err) {
    console.error("[Detectors] non_success_spike detector failed:", err);
  }
  // Silent failure detector
  try {
    const silentResults = detectSilentFailure(input, isInCooldown);
    results.push(...silentResults);
  } catch (err) {
    console.error("[Detectors] silent_failure detector failed:", err);
  }
  return results;
}
