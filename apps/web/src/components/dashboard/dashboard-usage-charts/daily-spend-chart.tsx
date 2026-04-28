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
} from "../../../pages/dashboard/dashboard-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../card";
import { ChartTooltipContent } from "../../chart-tooltip";
import { Skeleton } from "../../skeleton";

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
              <XAxis dataKey="date" tickFormatter={formatDate} />
              <YAxis tickFormatter={(v) => `$${v}`} />
              <Tooltip
                content={<ChartTooltipContent />}
                formatter={(v) => formatCurrency(Number(v))}
              />
              <Line
                type="monotone"
                dataKey="spend"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
