import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ModelDistributionItem } from "../../../pages/dashboard/dashboard-types";
import { formatNumber } from "../../../pages/dashboard/dashboard-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../card";
import { ChartTooltipContent } from "../../chart-tooltip";
import { Skeleton } from "../../skeleton";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

type ModelDistributionChartProps = {
  data: ModelDistributionItem[];
  loading: boolean;
  rangeLabel: string;
};

export function ModelDistributionChart({
  data,
  loading,
  rangeLabel,
}: ModelDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Usage Distribution ({rangeLabel})</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.slice(0, 8)}
                dataKey="request_count"
                nameKey="model"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, payload }) =>
                  `${name}: ${Number(payload?.percentage ?? 0).toFixed(1)}%`
                }
                labelLine={false}
              >
                {data.slice(0, 8).map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                content={<ChartTooltipContent />}
                formatter={(value, _name, item) => {
                  const percentage = Number(item.payload?.percentage ?? 0);
                  return `${formatNumber(Number(value))} (${percentage.toFixed(1)}%)`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
