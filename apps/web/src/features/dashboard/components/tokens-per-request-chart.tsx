import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyTokenTrendItem } from "@/features/dashboard/types/dashboard-types";
import {
  formatDateRange,
  formatNumber,
} from "@/features/dashboard/utils/dashboard-utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { ChartTooltipContent } from "@/shared/components/ui/chart-tooltip";
import { Skeleton } from "@/shared/components/ui/skeleton";

type TokensPerRequestChartProps = {
  loading: boolean;
  rangeLabel: string;
  dailyTokenTrend: DailyTokenTrendItem[];
};

export function TokensPerRequestChart({
  loading,
  rangeLabel,
  dailyTokenTrend,
}: TokensPerRequestChartProps) {
  const granularity = dailyTokenTrend[0]?.granularity ?? "1d";

  const chartData = useMemo(
    () =>
      dailyTokenTrend.map((item) => ({
        date: item.date,
        tokens_per_request: item.total_tokens / Math.max(item.request_count, 1),
        request_count: item.request_count,
      })),
    [dailyTokenTrend],
  );

  const barSize = useMemo(() => {
    const len = chartData.length;
    if (len <= 1) return 60;
    if (len <= 3) return 48;
    if (len <= 7) return 36;
    if (len <= 14) return 24;
    return 12;
  }, [chartData.length]);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>
          Tokens por Request ao Longo do Tempo ({rangeLabel})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => formatDateRange(date, granularity)}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis yAxisId="left" tickFormatter={formatNumber} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={formatNumber}
              />
              <Tooltip
                content={<ChartTooltipContent />}
                formatter={(v, name) =>
                  name === "Requests"
                    ? formatNumber(Number(v))
                    : formatNumber(Number(v))
                }
                labelFormatter={(label) => formatDateRange(label, granularity)}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="tokens_per_request"
                name="Tokens / Request"
                fill="#8b5cf6"
                barSize={barSize}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="request_count"
                name="Requests"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
