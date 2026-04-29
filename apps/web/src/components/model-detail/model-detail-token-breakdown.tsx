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
import type { ModelDailyTokenTrend } from "../../pages/model-detail/model-detail-types";
import {
  CHART_HEIGHT,
  formatNumber,
} from "../../pages/model-detail/model-detail-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChartTooltipContent } from "../ui/chart-tooltip";
import { Skeleton } from "../ui/skeleton";

type Props = {
  data: ModelDailyTokenTrend[];
  loading: boolean;
  rangeLabel?: string;
};

export function ModelDetailTokenBreakdown({
  data,
  loading,
  rangeLabel,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Token Usage Trend {rangeLabel && `(${rangeLabel})`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={formatNumber} />
              <Tooltip
                content={<ChartTooltipContent />}
                formatter={(v) => formatNumber(Number(v))}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="promptTokens"
                name="Input"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
              />
              <Area
                type="monotone"
                dataKey="completionTokens"
                name="Output"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
              />
              <Line
                type="monotone"
                dataKey="totalTokens"
                name="Total"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            No token data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
