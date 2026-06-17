#!/usr/bin/env tsx

/**
 * compare-analytics-sources.ts
 *
 * Compares LiteLLM vs model-proxy analytics totals in a date window using
 * HybridDataSource.compareTotals().
 *
 * Usage:
 *   pnpm analytics:compare-sources --start 2026-06-01 --end 2026-06-16
 *   pnpm analytics:compare-sources --days 7
 *   pnpm analytics:compare-sources --start 2026-06-01 --end 2026-06-16 --model gpt-4o
 *
 * Env:
 *   DB_* / DATABASE_URL           LiteLLM PostgreSQL (DatabaseDataSource)
 *   MODEL_PROXY_DATABASE_URL      model_proxy_* PostgreSQL (ModelProxyDataSource)
 */

import type { CompareTotalsResult } from "@lite-llm/analytics-service/data-source";
import {
  DatabaseDataSource,
  HybridDataSource,
  ModelProxyDataSource,
} from "@lite-llm/analytics-service/data-source";

interface CliOptions {
  startDate: string;
  endDate: string;
  model?: string;
}

function printHelp(): void {
  console.log(`
compare-analytics-sources — LiteLLM vs model-proxy totals comparison

OPTIONS:
  --start YYYY-MM-DD   Window start (inclusive, UTC)
  --end YYYY-MM-DD     Window end (inclusive, UTC)
  --days N             Last N days ending today (alternative to --start/--end)
  --model NAME         Optional model filter
  -h, --help           Show this help

EXAMPLES:
  pnpm analytics:compare-sources --days 7
  pnpm analytics:compare-sources --start 2026-06-01 --end 2026-06-16 --model gpt-4o
`);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseArgs(argv: string[]): CliOptions | null {
  if (argv.includes("-h") || argv.includes("--help")) {
    printHelp();
    return null;
  }

  let startDate: string | undefined;
  let endDate: string | undefined;
  let days: number | undefined;
  let model: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--start" && next) {
      startDate = next;
      index += 1;
    } else if (arg === "--end" && next) {
      endDate = next;
      index += 1;
    } else if (arg === "--days" && next) {
      days = Number(next);
      index += 1;
    } else if (arg === "--model" && next) {
      model = next;
      index += 1;
    }
  }

  if (days !== undefined) {
    if (!Number.isFinite(days) || days <= 0) {
      throw new Error("--days must be a positive number");
    }
    const end = new Date();
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - days);
    startDate = formatDate(start);
    endDate = formatDate(end);
  }

  if (!startDate || !endDate) {
    printHelp();
    throw new Error("Provide --start and --end, or --days N");
  }

  return { startDate, endDate, model };
}

function printMetric(
  label: string,
  metric: CompareTotalsResult[keyof CompareTotalsResult],
): void {
  const entries = Object.entries(metric)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
  const tolerance =
    "within_tolerance" in metric ? metric.within_tolerance : undefined;
  const status =
    tolerance === undefined ? "" : tolerance ? "OK" : "OUT OF TOLERANCE";
  console.log(`  ${label}: ${entries}${status ? ` [${status}]` : ""}`);
}

function printResult(window: CliOptions, result: CompareTotalsResult): void {
  console.log("\nAnalytics source comparison");
  console.log(`  window: ${window.startDate} → ${window.endDate}`);
  if (window.model) {
    console.log(`  model:  ${window.model}`);
  }
  console.log("");

  printMetric("requests", result.request_count);
  printMetric("tokens", result.total_tokens);
  printMetric("cost", result.total_cost);
  printMetric("errors", result.error_count);
  printMetric("avg_latency_ms", result.avg_latency_ms);

  const allWithinTolerance = [
    result.request_count.within_tolerance,
    result.total_tokens.within_tolerance,
    result.total_cost.within_tolerance,
    result.error_count.within_tolerance,
    result.avg_latency_ms.within_tolerance,
  ].every(Boolean);

  console.log("");
  console.log(
    allWithinTolerance
      ? "Gate: PASS — all metrics within tolerance"
      : "Gate: FAIL — at least one metric outside tolerance",
  );
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (!options) {
    return;
  }

  const hybrid = new HybridDataSource(
    new DatabaseDataSource(),
    new ModelProxyDataSource(),
  );

  const result = await hybrid.compareTotals({
    startDate: options.startDate,
    endDate: options.endDate,
    model: options.model,
  });

  printResult(options, result);

  const failed = [
    result.request_count.within_tolerance,
    result.total_tokens.within_tolerance,
    result.total_cost.within_tolerance,
    result.error_count.within_tolerance,
    result.avg_latency_ms.within_tolerance,
  ].some((value) => !value);

  if (failed) {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Compare failed: ${message}`);
  process.exit(1);
});
