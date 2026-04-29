import { useMemo } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ModelStatusDistribution } from "../../pages/model-detail/model-detail-types";
import {
  CHART_HEIGHT,
  formatNumber,
  formatPercent,
} from "../../pages/model-detail/model-detail-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChartTooltipContent } from "../ui/chart-tooltip";
import { Skeleton } from "../ui/skeleton";

type Props = {
  data: ModelStatusDistribution[];
  loading: boolean;
};

const STATUS_COLORS: Record<string, string> = {
  success: "#22c55e",
  failure: "#ef4444",
  error: "#ef4444",
};

export function ModelDetailStatusChart({ data, loading }: Props) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((item) => ({
      name: item.status,
      value: item.count,
      percentage: item.percentage,
      fill:
        STATUS_COLORS[item.status.toLowerCase()] ??
        `hsl(var(--chart-${(data.indexOf(item) % 5) + 1}))`,
    }));
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                content={<ChartTooltipContent />}
                formatter={(v, name) => {
                  const item = chartData.find((d) => d.name === name);
                  const pct = item ? formatPercent(item.percentage) : "";
                  return [`${formatNumber(Number(v))} (${pct})`, name];
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            No status data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
