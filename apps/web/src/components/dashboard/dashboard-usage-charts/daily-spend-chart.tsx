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
  formatDateRange,
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
  const granularity = data[0]?.granularity ?? "1d";

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
                tickFormatter={(date) => formatDateRange(date, granularity)}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis tickFormatter={(v) => `$${v}`} />
              <Tooltip
                content={<ChartTooltipContent />}
                formatter={(v) => formatCurrency(Number(v))}
                labelFormatter={(label) => formatDateRange(label, granularity)}
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
