import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ModelDailyLatencyTrend } from "../../pages/model-detail/model-detail-types";
import {
  CHART_HEIGHT,
  formatDuration,
} from "../../pages/model-detail/model-detail-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { ChartTooltipContent } from "../chart-tooltip";
import { Skeleton } from "../skeleton";

type Props = {
  data: ModelDailyLatencyTrend[];
  loading: boolean;
};

export function ModelDetailLatencyChart({ data, loading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Latency Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(v) => formatDuration(Number(v))} />
              <Tooltip
                content={<ChartTooltipContent />}
                formatter={(v) => formatDuration(Number(v))}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgLatencyMs"
                name="Avg"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="p50LatencyMs"
                name="P50"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="p95LatencyMs"
                name="P95"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="p99LatencyMs"
                name="P99"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            No latency data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
