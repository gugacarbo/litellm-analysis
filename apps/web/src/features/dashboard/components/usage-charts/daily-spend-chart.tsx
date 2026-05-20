import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { ChartTooltipContent } from "@/shared/components/ui/chart-tooltip";
import { Skeleton } from "@/shared/components/ui/skeleton";
import type { DailyTrendItem } from "../../types/dashboard-types";
import { formatCurrency, formatDateRange } from "../../utils/dashboard-utils";

type DailySpendChartProps = {
  data: DailyTrendItem[];
  loading: boolean;
};

export function DailySpendChart({
  data,
  loading,
}: DailySpendChartProps) {
  const granularity = data[0]?.granularity ?? "1d";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Spend Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
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
              <Bar
                dataKey="spend"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
