import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AlertsByTypeItem } from "use-monitor-derived";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { ChartTooltipContent } from "@/shared/components/ui/chart-tooltip";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { CHART_COLORS } from "@/shared/lib/chart-colors";

type AlertsByTypeChartProps = {
  data: AlertsByTypeItem[];
  loading?: boolean;
};

export function AlertsByTypeChart({ data, loading }: AlertsByTypeChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts by Type</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[240px] w-full" />
        ) : !data || data.length === 0 ? (
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            No alerts
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis
                dataKey="type"
                type="category"
                width={110}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill={CHART_COLORS[0]}
                radius={[0, 4, 4, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
