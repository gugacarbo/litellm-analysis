import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
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
import type { HourlyPatternItem } from "../../types/dashboard-types";
import { formatCurrency, formatNumber } from "../../utils/dashboard-utils";

type HourlyPatternChartProps = {
  data: HourlyPatternItem[];
  loading: boolean;
};

export function HourlyPatternChart({
  data,
  loading,
}: HourlyPatternChartProps) {
  const chartData = Array.from({ length: 24 }, (_, i) => {
    const hourData = data.find((h) => h.hour === i);
    return {
      hour: i,
      requests: hourData?.request_count || 0,
      spend: hourData?.total_spend || 0,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hourly Usage Pattern</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tickFormatter={(v) => `${v}:00`} />
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
              <Tooltip
                content={<ChartTooltipContent />}
                formatter={(v, key) =>
                  String(key).toLowerCase().includes("spend")
                    ? formatCurrency(Number(v))
                    : formatNumber(Number(v))
                }
              />
              <Legend />
              <Bar
                dataKey="requests"
                name="Requests"
                yAxisId="left"
                fill="#8b5cf6"
                fillOpacity={0.6}
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
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
