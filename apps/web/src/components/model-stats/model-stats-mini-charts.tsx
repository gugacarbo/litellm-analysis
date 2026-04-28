import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, LATENCY_COLORS } from "../../lib/chart-colors";
import { formatCurrency, formatDuration } from "../../lib/spend-log-utils";
import type { ModelStatistics } from "../../types/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { ChartTooltipContent } from "../chart-tooltip";
import { Skeleton } from "../skeleton";

type ModelStatsMiniChartsProps = {
  data: ModelStatistics[];
  loading: boolean;
};

function truncateModel(name: string, maxLen = 20): string {
  if (name.length <= maxLen) return name;
  return `${name.slice(0, maxLen - 1)}…`;
}

export function ModelStatsMiniCharts({
  data,
  loading,
}: ModelStatsMiniChartsProps) {
  const spendData = useMemo(() => {
    if (data.length === 0) return [];
    return [...data]
      .sort((a, b) => b.total_spend - a.total_spend)
      .slice(0, 5)
      .map((m) => ({
        model: truncateModel(m.model),
        spend: m.total_spend,
      }));
  }, [data]);

  const tokenData = useMemo(() => {
    if (data.length === 0) return [];
    return [...data]
      .sort((a, b) => b.total_tokens - a.total_tokens)
      .slice(0, 5)
      .map((m) => ({
        model: truncateModel(m.model),
        prompt_tokens: m.prompt_tokens,
        completion_tokens: m.completion_tokens,
      }));
  }, [data]);

  const latencyData = useMemo(() => {
    if (data.length === 0) return [];
    return [...data]
      .filter((m) => m.avg_latency_ms > 0)
      .map((m) => ({
        model: truncateModel(m.model),
        durationSec: m.avg_latency_ms / 1000,
        durationMs: m.avg_latency_ms,
        fill:
          m.avg_latency_ms >= 5000
            ? LATENCY_COLORS.p99
            : m.avg_latency_ms >= 1000
              ? LATENCY_COLORS.p95
              : CHART_COLORS[1],
      }))
      .sort((a, b) => b.durationSec - a.durationSec)
      .slice(0, 5);
  }, [data]);

  const statusData = useMemo(() => {
    if (data.length === 0) return null;
    const totalRequests = data.reduce(
      (sum, m) => sum + Number(m.request_count),
      0,
    );
    const totalErrors = data.reduce(
      (sum, m) => sum + Number(m.error_count),
      0,
    );
    const successRequests = totalRequests - totalErrors;
    const successPct =
      totalRequests > 0
        ? (successRequests / totalRequests) * 100
        : 0;
    const errorPct =
      totalRequests > 0
        ? (totalErrors / totalRequests) * 100
        : 0;
    return {
      success: successRequests,
      errors: totalErrors,
      total: totalRequests,
      successPct,
      errorPct,
    };
  }, [data]);

  if (!loading && data.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Top Spend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Top Spend (by Model)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[80px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={80}>
              <BarChart
                data={spendData}
                layout="vertical"
                margin={{ left: 0, right: 8, top: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `$${v}`}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  dataKey="model"
                  type="category"
                  width={90}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(v) => formatCurrency(Number(v))}
                />
                <Bar
                  dataKey="spend"
                  fill={CHART_COLORS[0]}
                  maxBarSize={16}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Token Ratio */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Token Ratio (Top 5)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[80px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={80}>
              <BarChart
                data={tokenData}
                layout="vertical"
                margin={{ left: 0, right: 8, top: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="model"
                  type="category"
                  width={90}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="prompt_tokens"
                  name="Prompt"
                  fill={CHART_COLORS[0]}
                  stackId="a"
                  maxBarSize={16}
                />
                <Bar
                  dataKey="completion_tokens"
                  name="Completion"
                  fill={CHART_COLORS[2]}
                  stackId="a"
                  maxBarSize={16}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Slowest Models */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Slowest Models (avg)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[80px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={80}>
              <BarChart
                data={latencyData}
                layout="vertical"
                margin={{ left: 0, right: 8, top: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `${v}s`}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  dataKey="model"
                  type="category"
                  width={90}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(v) => formatDuration(Number(v) * 1000)}
                />
                <Bar
                  dataKey="durationSec"
                  maxBarSize={16}
                  radius={[0, 4, 4, 0]}
                >
                  {latencyData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[80px] w-full" />
          ) : statusData ? (
            <div className="flex flex-col justify-center h-[80px] gap-3">
              <div className="w-full h-4 rounded-full bg-muted overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${statusData.successPct}%` }}
                />
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${statusData.errorPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="text-emerald-600 dark:text-emerald-400">
                  ✓ {statusData.success.toLocaleString("en-US")} success (
                  {statusData.successPct.toFixed(1)}%)
                </span>
                <span className="text-red-600 dark:text-red-400">
                  ✗ {statusData.errors.toLocaleString("en-US")} errors (
                  {statusData.errorPct.toFixed(1)}%)
                </span>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
