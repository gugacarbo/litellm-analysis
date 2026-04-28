import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ModelHourlyUsage } from "../../pages/model-detail/model-detail-types";
import { CHART_HEIGHT, formatCurrency } from "../../pages/model-detail/model-detail-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { ChartTooltipContent } from "../chart-tooltip";
import { Skeleton } from "../skeleton";

type Props = {
  data: ModelHourlyUsage[];
  loading: boolean;
};

export function ModelDetailHourlyChart({ data, loading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hourly Usage Pattern</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                tickFormatter={(v) => `${String(v).padStart(2, "0")}:00`}
              />
              <YAxis />
              <Tooltip
                content={<ChartTooltipContent />}
                formatter={(v, name) => {
                  if (name === "totalSpend") return formatCurrency(Number(v));
                  return [Number(v).toLocaleString(), name === "requestCount" ? "Requests" : "Tokens"];
                }}
                labelFormatter={(label) => `${String(label).padStart(2, "0")}:00 - ${String(Number(label) + 1).padStart(2, "0")}:00`}
              />
              <Bar
                dataKey="requestCount"
                name="Requests"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            No hourly data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}