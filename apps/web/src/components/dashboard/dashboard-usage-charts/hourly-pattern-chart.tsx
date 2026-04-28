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
import type { HourlyPatternItem } from "../../../pages/dashboard/dashboard-types";
import {
  formatCurrency,
  formatNumber,
} from "../../../pages/dashboard/dashboard-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../card";
import { ChartTooltipContent } from "../../chart-tooltip";
import { Skeleton } from "../../skeleton";

type HourlyPatternChartProps = {
  data: HourlyPatternItem[];
  loading: boolean;
  rangeLabel: string;
};

export function HourlyPatternChart({
  data,
  loading,
  rangeLabel,
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
        <CardTitle>Hourly Usage Pattern ({rangeLabel})</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
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
              <Area
                type="monotone"
                dataKey="requests"
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
        )}
      </CardContent>
    </Card>
  );
}
