import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ModelDailyErrorTrend } from "@/features/models/detail/model-detail-types";
import {
  CHART_HEIGHT,
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

type Props = {
  data: ModelDailyErrorTrend[];
  loading: boolean;
  rangeLabel?: string;
};

export function ModelDetailErrorTrendChart({
  data,
  loading,
  rangeLabel,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Trend {rangeLabel && `(${rangeLabel})`}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(v) => formatNumber(Number(v))} />
              <Tooltip
                content={<ChartTooltipContent />}
                formatter={(v) => [formatNumber(Number(v)), "Errors"]}
              />
              <Line
                type="monotone"
                dataKey="errorCount"
                name="Error Count"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            No error trend data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
