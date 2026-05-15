// apps/web/src/components/time-series-card.tsx
import type { ReactNode } from "react";
import {
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTimeSeriesFormat } from "../hooks/use-time-series-format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ChartTooltipContent } from "./ui/chart-tooltip";
import { Skeleton } from "./ui/skeleton";

interface RightYAxisConfig {
  dataKey: string;
  name: string;
  tickFormatter?: (value: number) => string;
}

interface TimeSeriesCardProps {
  title: string;
  description?: string;
  data: unknown[] | undefined;
  isLoading: boolean;
  granularity?: string;
  height?: number;
  emptyMessage?: string;
  rightYAxis?: RightYAxisConfig;
  formatY?: (value: number) => string;
  formatYRight?: (value: number) => string;
  children: ReactNode;
}

export function TimeSeriesCard({
  title,
  description,
  data,
  isLoading,
  granularity,
  height = 300,
  emptyMessage = "No data available",
  rightYAxis,
  formatY,
  formatYRight,
  children,
}: TimeSeriesCardProps) {
  const { formatX, formatTooltipLabel, tickInterval } =
    useTimeSeriesFormat(granularity);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !data?.length ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatX}
                interval={tickInterval}
                minTickGap={50}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={formatY}
                allowDecimals={false}
              />
              {rightYAxis && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={formatYRight}
                />
              )}
              <Tooltip
                content={<ChartTooltipContent />}
                labelFormatter={(label) => formatTooltipLabel(String(label))}
              />
              {children}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
