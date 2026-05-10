import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  CostEfficiencyItem,
  DailyTokenTrendItem,
} from "../../pages/dashboard/dashboard-types";
import {
  formatDate,
  formatDateTime,
  formatNumber,
} from "../../pages/dashboard/dashboard-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChartTooltipContent } from "../ui/chart-tooltip";
import { Skeleton } from "../ui/skeleton";

type DashboardEfficiencyChartsProps = {
  loading: boolean;
  rangeLabel: string;
  costEfficiency: CostEfficiencyItem[];
  dailyTokenTrend: DailyTokenTrendItem[];
};

export function DashboardEfficiencyCharts({
  loading,
  rangeLabel,
  costEfficiency,
  dailyTokenTrend,
}: DashboardEfficiencyChartsProps) {
  // Check if data has hourly granularity
  const hasHourlyData =
    dailyTokenTrend.length > 0 && dailyTokenTrend[0].date.includes(" ");

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Cost Efficiency by Model ($/1K tokens, {rangeLabel})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costEfficiency.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `$${v.toFixed(2)}`}
                />
                <YAxis
                  dataKey="model"
                  type="category"
                  width={120}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(v) => `$${Number(v).toFixed(4)}`}
                />
                <Bar dataKey="cost_per_1k_tokens" fill="#f59e0b" />
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
                  tickFormatter={formatDate}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis tickFormatter={formatNumber} />
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(v) => formatNumber(Number(v))}
                  labelFormatter={(label) =>
                    hasHourlyData ? formatDateTime(label) : formatDate(label)
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
                  tickFormatter={formatDate}
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
                    hasHourlyData ? formatDateTime(label) : formatDate(label)
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
    </div>
  );
}
