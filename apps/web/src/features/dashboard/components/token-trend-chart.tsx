import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyTokenTrendItem } from "@/features/dashboard/types/dashboard-types";
import {
  formatDateRange,
  formatNumber,
} from "@/features/dashboard/utils/dashboard-utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { ChartTooltipContent } from "@/shared/components/ui/chart-tooltip";
import { Skeleton } from "@/shared/components/ui/skeleton";

type TokenTrendChartProps = {
  loading: boolean;
  dailyTokenTrend: DailyTokenTrendItem[];
};

export function TokenTrendChart({
  loading,
  dailyTokenTrend,
}: TokenTrendChartProps) {
  const granularity = dailyTokenTrend[0]?.granularity ?? "1d";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Trend</CardTitle>
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
                labelFormatter={(label) => formatDateRange(label, granularity)}
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
  );
}
