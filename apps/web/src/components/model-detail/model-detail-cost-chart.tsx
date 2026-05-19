import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ModelDailySpendTrend } from "@/features/models/detail/model-detail-types";
import {
  CHART_HEIGHT,
  formatCurrency,
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
  data: ModelDailySpendTrend[];
  loading: boolean;
  rangeLabel: string;
};

export function ModelDetailCostChart({ data, loading, rangeLabel }: Props) {
  const costPerTokenData = data.map((item) => ({
    ...item,
    costPerMTokens:
      item.totalTokens > 0 ? (item.spend / item.totalTokens) * 1_000_000 : 0,
  }));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Cost Trend {rangeLabel && `(${rangeLabel})`}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : data.length > 0 ? (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v) => formatCurrency(Number(v))} />
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(v) => formatCurrency(Number(v))}
                />
                <Line
                  type="monotone"
                  dataKey="spend"
                  name="Spend"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              No cost data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Cost per Million Tokens {rangeLabel && `(${rangeLabel})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : costPerTokenData.length > 0 ? (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart data={costPerTokenData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v) => formatCurrency(Number(v))} />
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(v) => formatCurrency(Number(v))}
                />
                <Bar
                  dataKey="costPerMTokens"
                  name="Cost/M tokens"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              No cost data available
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
