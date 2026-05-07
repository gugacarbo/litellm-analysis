import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
  const tokensPerRequestData = useMemo(
    () =>
      dailyTokenTrend.map((item) => ({
        date: item.date,
        tokens_per_request: item.total_tokens / Math.max(item.request_count, 1),
      })),
    [dailyTokenTrend],
  );

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
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis tickFormatter={formatNumber} />
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(v) => formatNumber(Number(v))}
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
              <LineChart data={tokensPerRequestData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis tickFormatter={formatNumber} />
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(v) => formatNumber(Number(v))}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="tokens_per_request"
                  name="Tokens / Request"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
