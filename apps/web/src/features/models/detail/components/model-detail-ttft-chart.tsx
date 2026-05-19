import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ModelTTFTPercentiles } from "@/features/models/detail/model-detail-types";
import {
  CHART_HEIGHT,
  formatDuration,
} from "@/features/models/detail/model-detail-utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { ChartTooltipContent } from "@/shared/components/ui/chart-tooltip";
import { Skeleton } from "@/shared/components/ui/skeleton";

type Props = {
  data: ModelTTFTPercentiles | null;
  loading: boolean;
};

const TTFT_COLORS = ["#8b5cf6", "#3b82f6", "#f59e0b", "#ef4444"];

export function ModelDetailTTFTChart({ data, loading }: Props) {
  const chartData = data
    ? [
        { name: "P50", value: data.p50_ttft_ms },
        { name: "Avg", value: data.avg_ttft_ms },
        { name: "P95", value: data.p95_ttft_ms },
        { name: "P99", value: data.p99_ttft_ms },
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time to First Token (TTFT)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : data && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                tickFormatter={(v) => formatDuration(Number(v))}
              />
              <YAxis dataKey="name" type="category" width={60} />
              <Tooltip
                content={<ChartTooltipContent />}
                formatter={(v) => formatDuration(Number(v))}
              />
              <Bar
                dataKey="value"
                name="TTFT"
                radius={[0, 4, 4, 0]}
                maxBarSize={40}
              >
                {chartData.map((entry, index) => (
                  <Cell key={entry.name} fill={TTFT_COLORS[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            No streaming data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
