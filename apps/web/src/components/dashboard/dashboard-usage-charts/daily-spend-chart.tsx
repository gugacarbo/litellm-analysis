import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyTrendItem } from "../../../pages/dashboard/dashboard-types";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from "../../../pages/dashboard/dashboard-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { ChartTooltipContent } from "../../ui/chart-tooltip";
import { Skeleton } from "../../ui/skeleton";

type DailySpendChartProps = {
  data: DailyTrendItem[];
  loading: boolean;
  rangeLabel: string;
};

export function DailySpendChart({
  data,
  loading,
  rangeLabel,
}: DailySpendChartProps) {
  // Check if data has hourly granularity (contains space in date strings)
  const hasHourlyData = data.length > 0 && data[0].date.includes(" ");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Spend Trend ({rangeLabel})</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis tickFormatter={(v) => `$${v}`} />
              <Tooltip
                content={<ChartTooltipContent />}
                formatter={(v) => formatCurrency(Number(v))}
                labelFormatter={(label) =>
                  hasHourlyData ? formatDateTime(label) : formatDate(label)
                }
              />
              <Line
                type="monotone"
                dataKey="spend"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
