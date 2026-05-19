import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ModelProviderBreakdown } from "@/features/models/detail/model-detail-types";
import {
  CHART_HEIGHT,
  formatCurrency,
  formatDuration,
  formatNumber,
} from "@/features/models/detail/model-detail-utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { ChartTooltipContent } from "@/shared/components/ui/chart-tooltip";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { CHART_COLORS } from "@/shared/lib/chart-colors";

type Props = {
  data: ModelProviderBreakdown[];
  loading: boolean;
};

export function ModelDetailProviderChart({ data, loading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="provider" />
              <YAxis tickFormatter={(v) => formatNumber(Number(v))} />
              <Tooltip
                content={<ChartTooltipContent />}
                formatter={(v, name) => {
                  if (name === "total_spend")
                    return [formatCurrency(Number(v)), "Spend"];
                  if (name === "avg_latency_ms")
                    return [formatDuration(Number(v)), "Avg Latency"];
                  return [formatNumber(Number(v)), "Requests"];
                }}
              />
              <Legend />
              <Bar
                dataKey="request_count"
                name="Requests"
                radius={[4, 4, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.provider}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            No provider data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
