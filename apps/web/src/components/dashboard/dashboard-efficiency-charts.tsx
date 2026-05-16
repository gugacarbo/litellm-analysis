import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  CostEfficiencyItem,
  DailyTokenTrendItem,
} from "../../pages/dashboard/dashboard-types";
import {
  formatDateRange,
  formatNumber,
} from "../../pages/dashboard/dashboard-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChartTooltipContent } from "../ui/chart-tooltip";
import { Skeleton } from "../ui/skeleton";

/** Format cost per 1K tokens with 4-5 decimal places and at most 1 trailing zero */
function formatCost(n: number): string {
  const fixed = n.toFixed(5);
  const stripped = fixed.replace(/0+$/, "");
  const dotIdx = stripped.indexOf(".");
  const decLen = dotIdx === -1 ? 0 : stripped.length - dotIdx - 1;
  if (decLen < 4) return n.toFixed(4);
  return stripped;
}

/** Scatter data: model efficiency vs speed (tokens/second) */
type EfficiencyVsSpeedItem = {
  model: string;
  efficiency_score: number;
  cost_per_1k_tokens: number;
  avg_tokens_per_second: number;
  total_tokens: number;
};

type DashboardEfficiencyChartsProps = {
  loading: boolean;
  rangeLabel: string;
  costEfficiency: CostEfficiencyItem[];
  dailyTokenTrend: DailyTokenTrendItem[];
  modelStatistics: {
    model: string;
    avg_tokens_per_second: number;
    total_tokens: number;
  }[];
};

export function DashboardEfficiencyCharts({
  loading,
  rangeLabel,
  costEfficiency,
  dailyTokenTrend,
  modelStatistics,
}: DashboardEfficiencyChartsProps) {
  const granularity = dailyTokenTrend[0]?.granularity ?? "1d";

  // Transform: invert so lower cost = higher bar (better efficiency)
  const costEfficiencyData = useMemo(() => {
    if (costEfficiency.length === 0) return [];
    const items = costEfficiency.slice(0, 10);
    const maxCost = Math.max(...items.map((i) => i.cost_per_1k_tokens));
    return items
      .map((item) => {
        const raw = maxCost / Math.max(item.cost_per_1k_tokens, 0.0001);
        return {
          ...item,
          efficiency_score: Math.round(raw * 100) / 100,
        };
      })
      .sort((a, b) => b.efficiency_score - a.efficiency_score);
  }, [costEfficiency]);

  const tokensPerRequestData = useMemo(
    () =>
      dailyTokenTrend.map((item) => ({
        date: item.date,
        tokens_per_request: item.total_tokens / Math.max(item.request_count, 1),
        request_count: item.request_count,
      })),
    [dailyTokenTrend],
  );

  const barSize = useMemo(() => {
    const len = tokensPerRequestData.length;
    if (len <= 1) return 60;
    if (len <= 3) return 48;
    if (len <= 7) return 36;
    if (len <= 14) return 24;
    return 12;
  }, [tokensPerRequestData.length]);

  const avgCostPer1k = useMemo(() => {
    if (costEfficiency.length === 0) return 0;
    return (
      costEfficiency.reduce((s, i) => s + i.cost_per_1k_tokens, 0) /
      costEfficiency.length
    );
  }, [costEfficiency]);

  // Merge cost efficiency (for score) with model stats (for speed)
  const efficiencyVsSpeedData = useMemo((): EfficiencyVsSpeedItem[] => {
    const statsByName = new Map(modelStatistics.map((s) => [s.model, s]));
    return costEfficiency
      .slice(0, 30)
      .map((item) => {
        const stats = statsByName.get(item.model);
        const raw =
          Math.max(...costEfficiency.map((i) => i.cost_per_1k_tokens)) /
          Math.max(item.cost_per_1k_tokens, 0.0001);
        return {
          model: item.model,
          efficiency_score: Math.round(raw * 100) / 100,
          cost_per_1k_tokens: item.cost_per_1k_tokens,
          avg_tokens_per_second: stats?.avg_tokens_per_second ?? 0,
          total_tokens: item.total_tokens,
        };
      })
      .filter((d) => d.avg_tokens_per_second > 0);
  }, [costEfficiency, modelStatistics]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Model Efficiency — estimated from $/1K tokens (avg $
            {formatCost(avgCostPer1k)}/1K)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costEfficiencyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `${v.toFixed(1)}x`}
                  label={{
                    value: "Efficiency Score (# cheaper than most expensive)",
                    position: "insideBottom",
                    offset: -5,
                    style: { fontSize: 12 },
                  }}
                />
                <YAxis
                  dataKey="model"
                  type="category"
                  width={120}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(
                    _value,
                    name,
                    props: {
                      payload?: CostEfficiencyItem & {
                        efficiency_score: number;
                      };
                    },
                  ) => {
                    const data = props?.payload;
                    if (name === "Efficiency" && data) {
                      return `${data.efficiency_score.toFixed(
                        2,
                      )}x cheaper — $${formatCost(
                        data.cost_per_1k_tokens,
                      )}/1K tokens`;
                    }
                    return _value;
                  }}
                />
                <Bar
                  dataKey="efficiency_score"
                  fill="#10b981"
                  name="Efficiency"
                  radius={[0, 4, 4, 0]}
                >
                  <LabelList
                    dataKey="cost_per_1k_tokens"
                    position="right"
                    formatter={(v: unknown) => `$${formatCost(Number(v))}/1K`}
                    style={{ fontSize: 10, fill: "#6b7280" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Token Trend ({rangeLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyTokenTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => formatDateRange(date, granularity)}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis tickFormatter={formatNumber} />
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(v) => formatNumber(Number(v))}
                  labelFormatter={(label) =>
                    formatDateRange(label, granularity)
                  }
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="prompt_tokens"
                  name="Input"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                />
                <Area
                  type="monotone"
                  dataKey="completion_tokens"
                  name="Output"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                />
                <Line
                  type="monotone"
                  dataKey="total_tokens"
                  name="Total"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>
            Tokens por Request ao Longo do Tempo ({rangeLabel})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tokensPerRequestData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => formatDateRange(date, granularity)}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis yAxisId="left" tickFormatter={formatNumber} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={formatNumber}
                />
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(v, name) =>
                    name === "Requests"
                      ? formatNumber(Number(v))
                      : formatNumber(Number(v))
                  }
                  labelFormatter={(label) =>
                    formatDateRange(label, granularity)
                  }
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="tokens_per_request"
                  name="Tokens / Request"
                  fill="#8b5cf6"
                  barSize={barSize}
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="request_count"
                  name="Requests"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Efficiency vs Speed ({rangeLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-80 w-full" />
          ) : efficiencyVsSpeedData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              No speed data available for these models
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid />
                <XAxis
                  type="number"
                  dataKey="efficiency_score"
                  name="Efficiency"
                  label={{
                    value: "Efficiency Score (× cheaper)",
                    position: "insideBottom",
                    offset: -10,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="avg_tokens_per_second"
                  name="Speed"
                  label={{
                    value: "Avg Tokens / Second",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]
                      ?.payload as EfficiencyVsSpeedItem | null;
                    if (!d) return null;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                        <div className="font-medium">{d.model}</div>
                        <div>
                          Efficiency: {d.efficiency_score.toFixed(2)}× cheaper
                        </div>
                        <div>
                          Speed: {formatNumber(d.avg_tokens_per_second)} tok/s
                        </div>
                        <div>
                          Cost: ${formatCost(d.cost_per_1k_tokens)}/1K tokens
                        </div>
                      </div>
                    );
                  }}
                />
                <Scatter
                  name="Models"
                  data={efficiencyVsSpeedData}
                  fill="#8b5cf6"
                />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
