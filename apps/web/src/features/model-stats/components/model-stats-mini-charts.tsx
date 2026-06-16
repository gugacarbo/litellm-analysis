import type { ModelStatistics } from "@lite-llm/contracts/analytics";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { APP_LOCALE } from "@/shared/lib/locale";
import { formatCurrency, formatDuration } from "@/shared/lib/spend-log-utils";
import { BarRow } from "./bar-row";

type ModelStatsMiniChartsProps = {
  data: ModelStatistics[];
  loading: boolean;
};

export function ModelStatsMiniCharts({
  data,
  loading,
}: ModelStatsMiniChartsProps) {
  const topBySpend = [...data]
    .sort((a, b) => Number(b.total_spend) - Number(a.total_spend))
    .slice(0, 5);
  const maxSpend = topBySpend[0] ? Number(topBySpend[0].total_spend) : 0;

  const topByTokens = [...data]
    .sort((a, b) => Number(b.total_tokens) - Number(a.total_tokens))
    .slice(0, 5);
  const maxTokens = topByTokens[0] ? Number(topByTokens[0].total_tokens) : 0;

  const slowestModels = [...data]
    .filter((m) => Number(m.avg_latency_ms) > 0)
    .sort((a, b) => Number(b.avg_latency_ms) - Number(a.avg_latency_ms))
    .slice(0, 5);
  const maxLatency =
    slowestModels[0] && Number(slowestModels[0].avg_latency_ms) > 0
      ? Number(slowestModels[0].avg_latency_ms)
      : 0;

  const totalRequests = data.reduce(
    (sum, m) => sum + Number(m.request_count),
    0,
  );
  const totalErrors = data.reduce(
    (sum, m) => sum + Number(m.error_count || 0),
    0,
  );
  const successRequests = totalRequests - totalErrors;
  const successPct =
    totalRequests > 0 ? (successRequests / totalRequests) * 100 : 0;
  const errorPct = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

  if (!loading && data.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Top Spend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Top Spend (by Model)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-3/4" />
                </div>
              ))
            : topBySpend.map((m) => (
                <BarRow
                  key={m.model}
                  label={m.model}
                  value={Number(m.total_spend)}
                  formatted={formatCurrency(m.total_spend)}
                  max={maxSpend}
                  color="bg-blue-500"
                  href={`/models/${encodeURIComponent(m.model)}`}
                />
              ))}
        </CardContent>
      </Card>

      {/* Token Ratio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Token Ratio (Top 5)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-3/4" />
                </div>
              ))
            : topByTokens.map((m) => {
                return (
                  <div key={m.model} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-xs truncate max-w-[60%]">
                        {m.model || "(no model)"}
                      </span>
                      <span className="text-muted-foreground tabular-nums text-xs">
                        {Number(m.total_tokens).toLocaleString(APP_LOCALE)}{" "}
                        tokens
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{
                          width: `${
                            maxTokens > 0
                              ? (Number(m.prompt_tokens) / maxTokens) * 100
                              : 0
                          }%`,
                        }}
                      />
                      <div
                        className="h-full bg-orange-400 transition-all"
                        style={{
                          width: `${
                            maxTokens > 0
                              ? (Number(m.completion_tokens) / maxTokens) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
        </CardContent>
      </Card>

      {/* Slowest Models */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Slowest Models (avg)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-3/4" />
                </div>
              ))
            : slowestModels.map((m) => {
                const latency = Number(m.avg_latency_ms);
                return (
                  <BarRow
                    key={m.model}
                    label={m.model}
                    value={latency}
                    formatted={formatDuration(latency)}
                    max={maxLatency}
                    color={
                      latency >= 5000
                        ? "bg-red-500"
                        : latency >= 1000
                          ? "bg-yellow-500"
                          : "bg-emerald-500"
                    }
                    href={`/models/${encodeURIComponent(m.model)}`}
                  />
                );
              })}
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <div className="flex flex-col justify-center h-full gap-3">
              <div className="w-full h-4 rounded-full bg-muted overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${successPct}%` }}
                />
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${errorPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="text-emerald-600 dark:text-emerald-400">
                  ✓ {successRequests.toLocaleString(APP_LOCALE)} success (
                  {successPct.toFixed(1)}%)
                </span>
                <span className="text-red-600 dark:text-red-400">
                  ✗ {totalErrors.toLocaleString(APP_LOCALE)} errors (
                  {errorPct.toFixed(1)}%)
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
