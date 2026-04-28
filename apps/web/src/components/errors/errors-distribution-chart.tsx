import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ERROR_COLOR } from "../../lib/chart-colors";
import type { ErrorLog } from "../../types/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { ChartTooltipContent } from "../chart-tooltip";
import { Skeleton } from "../skeleton";

type ErrorsDistributionChartProps = {
  errors: ErrorLog[];
  loading: boolean;
};

export function ErrorsDistributionChart({
  errors,
  loading,
}: ErrorsDistributionChartProps) {
  const data = useMemo(() => {
    const counts = new Map<string, number>();
    for (const error of errors) {
      const type = error.error_type || "Unknown";
      counts.set(type, (counts.get(type) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [errors]);

  if (errors.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Error Type Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 0, right: 20, top: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                dataKey="type"
                type="category"
                width={140}
                tick={{ fontSize: 11 }}
                tickFormatter={(value: string) =>
                  value.length > 25 ? `${value.slice(0, 25)}...` : value
                }
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill={ERROR_COLOR}
                maxBarSize={24}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
