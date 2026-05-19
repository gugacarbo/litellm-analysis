import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ModelDailyTokenTrend } from "@/features/models/detail/model-detail-types";
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
  data: ModelDailyTokenTrend[];
  loading: boolean;
  rangeLabel: string;
};

export function ModelDetailTokenEfficiency({
  data,
  loading,
  rangeLabel,
}: Props) {
  const ratioData = data.map((item) => ({
    ...item,
    inputOutputRatio:
      item.completionTokens > 0
        ? item.promptTokens / item.completionTokens
        : item.promptTokens > 0
          ? Infinity
          : 0,
  }));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            Token Usage Breakdown {rangeLabel && `(${rangeLabel})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : data.length > 0 ? (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={formatNumber} />
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(v) => formatNumber(Number(v))}
                />
                <Area
                  type="monotone"
                  dataKey="promptTokens"
                  name="Input Tokens"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="completionTokens"
                  name="Output Tokens"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              No token data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Input/Output Ratio {rangeLabel && `(${rangeLabel})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : ratioData.length > 0 ? (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <LineChart data={ratioData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v) => `${Number(v).toFixed(1)}x`} />
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(v) => {
                    const n = Number(v);
                    if (!Number.isFinite(n)) return ["N/A", "Ratio"];
                    return [`${n.toFixed(2)}x`, "Input/Output Ratio"];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="inputOutputRatio"
                  name="Input/Output Ratio"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              No token data available
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
