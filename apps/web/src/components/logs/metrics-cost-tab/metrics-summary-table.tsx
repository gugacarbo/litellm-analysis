import type { SpendLog } from "@lite-llm/api-contracts/analytics";
import {
  formatCurrency,
  formatDuration,
  formatFullDateTime,
  formatNumber,
} from "@/lib/spend-log-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

interface MetricsSummaryTableProps {
  log: SpendLog;
  durationMs: number;
}

type MetricRow = {
  label: string;
  value: string;
  highlight?: boolean;
};

export function MetricsSummaryTable({
  log,
  durationMs,
}: MetricsSummaryTableProps) {
  const rows: MetricRow[] = [
    { label: "Total Spend", value: formatCurrency(log.spend), highlight: true },
    {
      label: "Request Duration",
      value: formatDuration(durationMs),
    },
    {
      label: "Time to First Token",
      value:
        log.time_to_first_token_ms != null
          ? `${Math.round(log.time_to_first_token_ms)}ms`
          : "N/A",
    },
    { label: "Total Tokens", value: formatNumber(log.total_tokens) },
    { label: "Input Tokens", value: formatNumber(log.prompt_tokens) },
    { label: "Output Tokens", value: formatNumber(log.completion_tokens) },
    {
      label: "Input/Output Ratio",
      value:
        log.prompt_tokens > 0
          ? `${(log.completion_tokens / log.prompt_tokens).toFixed(2)}:1`
          : "N/A",
    },
    { label: "Start Time", value: formatFullDateTime(log.start_time) },
    { label: "End Time", value: formatFullDateTime(log.end_time) },
    ...(log.request_duration_ms != null
      ? [
          {
            label: "Request Duration (ms)",
            value: `${log.request_duration_ms}ms`,
          },
        ]
      : []),
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">All Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-2 px-1 first:pt-0 last:pb-0"
            >
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span
                className={`text-sm font-medium ${
                  row.highlight ? "text-emerald-600 dark:text-emerald-400" : ""
                }`}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
