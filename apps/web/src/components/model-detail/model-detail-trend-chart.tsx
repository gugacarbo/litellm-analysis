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
import type { ModelDailySpendTrend } from "../../pages/model-detail/model-detail-types";
import {
  CHART_HEIGHT,
  formatCurrency,
  formatNumber,
} from "../../pages/model-detail/model-detail-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { ChartTooltipContent } from "../chart-tooltip";
import { Skeleton } from "../skeleton";

type Props = {
  data: ModelDailySpendTrend[];
  loading: boolean;
};

export function ModelDetailTrendChart({ data, loading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Spend Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis
                yAxisId="left"
                tickFormatter={formatNumber}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(v) => formatCurrency(Number(v))}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="requestCount"
                name="Requests"
                yAxisId="left"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.3}
              />
              <Line
                type="monotone"
                dataKey="spend"
                name="Spend"
                yAxisId="right"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            No trend data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
