import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CHART_HEIGHT,
  ERROR_CHART_COLOR,
  LATENCY_CHART_COLORS,
  MODEL_STATS_CHART_COLORS,
  TOP_N_MODELS,
} from "../../pages/model-stats/model-stats-chart-utils";
import type { ModelStats } from "../../pages/model-stats/model-stats-types";
import {
  formatCurrency,
  formatDuration,
  formatNumber,
} from "../../pages/model-stats/model-stats-utils";
import type {
  CostEfficiency,
  ModelDistribution,
  TokenDistribution,
} from "../../types/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { ChartTooltipContent } from "../chart-tooltip";
import { Skeleton } from "../skeleton";

type ModelStatsChartsProps = {
  loading: boolean;
  tokenDistribution: TokenDistribution[];
  modelDistribution: ModelDistribution[];
  costEfficiency: CostEfficiency[];
  sortedData: ModelStats[];
  rangeLabel: string;
};

export function ModelStatsCharts({
  loading,
  tokenDistribution,
  modelDistribution,
  costEfficiency,
  sortedData,
  rangeLabel,
}: ModelStatsChartsProps) {
  const latencyData = sortedData
    .filter((m) => m.p50_latency_ms > 0)
    .slice(0, TOP_N_MODELS)
    .map((m) => ({
      model: m.model,
      p50: m.p50_latency_ms,
      p95: m.p95_latency_ms,
      p99: m.p99_latency_ms,
    }));

  const errorData = sortedData
    .filter((m) => m.error_count > 0)
    .sort((a, b) => b.error_count - a.error_count)
    .slice(0, TOP_N_MODELS)
    .map((m) => ({
      model: m.model,
      errors: m.error_count,
      success_rate: Number(m.success_rate),
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Token Distribution by Model ({rangeLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : tokenDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart
                data={tokenDistribution.slice(0, TOP_N_MODELS)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatNumber} />
                <YAxis
                  dataKey="model"
                  type="category"
                  width={150}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(v) => formatNumber(Number(v))}
                />
                <Legend />
                <Bar
                  dataKey="prompt_tokens"
                  name="Input Tokens"
                  fill={MODEL_STATS_CHART_COLORS[0]}
                  stackId="a"
                  maxBarSize={30}
                />
                <Bar
                  dataKey="completion_tokens"
                  name="Output Tokens"
                  fill={MODEL_STATS_CHART_COLORS[1]}
                  stackId="a"
                  maxBarSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cost Efficiency ($/1K tokens) ({rangeLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : costEfficiency.length > 0 ? (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart
                data={costEfficiency.slice(0, TOP_N_MODELS)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `$${v.toFixed(2)}`}
                />
                <YAxis
                  dataKey="model"
                  type="category"
                  width={150}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(v) => `$${Number(v).toFixed(4)}`}
                />
                <Bar
                  dataKey="cost_per_1k_tokens"
                  fill={MODEL_STATS_CHART_COLORS[2]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Latency Percentiles ({rangeLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : latencyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart data={latencyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatDuration(Number(v))}
                />
                <YAxis
                  dataKey="model"
                  type="category"
                  width={150}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(v) => formatDuration(Number(v))}
                />
                <Legend />
                <Bar
                  dataKey="p50"
                  name="P50"
                  fill={LATENCY_CHART_COLORS.p50}
                  maxBarSize={20}
                />
                <Bar
                  dataKey="p95"
                  name="P95"
                  fill={LATENCY_CHART_COLORS.p95}
                  maxBarSize={20}
                />
                <Bar
                  dataKey="p99"
                  name="P99"
                  fill={LATENCY_CHART_COLORS.p99}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Error Breakdown ({rangeLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : errorData.length > 0 ? (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart data={errorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  dataKey="model"
                  type="category"
                  width={150}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(v) => formatNumber(Number(v))}
                />
                <Bar
                  dataKey="errors"
                  name="Error Count"
                  fill={ERROR_CHART_COLOR}
                  maxBarSize={30}
                >
                  {errorData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.success_rate < 90
                          ? "#ef4444"
                          : entry.success_rate < 95
                            ? "#f59e0b"
                            : "#10b981"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request Distribution ({rangeLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : modelDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <PieChart>
                <Pie
                  data={modelDistribution.slice(0, 6)}
                  dataKey="request_count"
                  nameKey="model"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, payload }) =>
                    `${name}: ${Number(payload?.percentage ?? 0).toFixed(1)}%`
                  }
                  labelLine={false}
                >
                  {modelDistribution.slice(0, 6).map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        MODEL_STATS_CHART_COLORS[
                          index % MODEL_STATS_CHART_COLORS.length
                        ]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(value, _name, item) => {
                    const pct = Number(item?.payload?.percentage ?? 0);
                    return `${formatNumber(Number(value))} (${pct.toFixed(1)}%)`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spend by Model ({rangeLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : costEfficiency.length > 0 ? (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart
                data={costEfficiency.slice(0, TOP_N_MODELS)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatCurrency(Number(v))}
                />
                <YAxis
                  dataKey="model"
                  type="category"
                  width={150}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(v) => formatCurrency(Number(v))}
                />
                <Bar dataKey="total_spend" fill={MODEL_STATS_CHART_COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
