import { useMemo } from "react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CostEfficiencyItem } from "@/features/dashboard/types/dashboard-types";
import { formatDateRange, formatNumber } from "@/features/dashboard/utils/dashboard-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

/** Format cost per 1K tokens with 4-5 decimal places and at most 1 trailing zero */
function formatCost(n: number): string {
  const fixed = n.toFixed(5);
  const stripped = fixed.replace(/0+$/, "");
  const dotIdx = stripped.indexOf(".");
  const decLen = dotIdx === -1 ? 0 : stripped.length - dotIdx - 1;
  if (decLen < 4) return n.toFixed(4);
  return stripped;
}

type EfficiencyVsSpeedItem = {
  model: string;
  efficiency_score: number;
  cost_per_1k_tokens: number;
  avg_tokens_per_second: number;
  total_tokens: number;
};

type EfficiencyVsSpeedChartProps = {
  loading: boolean;
  rangeLabel: string;
  costEfficiency: CostEfficiencyItem[];
  modelStatistics: {
    model: string;
    avg_tokens_per_second: number;
    total_tokens: number;
  }[];
};

export function EfficiencyVsSpeedChart({
  loading,
  rangeLabel,
  costEfficiency,
  modelStatistics,
}: EfficiencyVsSpeedChartProps) {
  const granularity = modelStatistics[0]?.granularity ?? "1d";

  const chartData = useMemo((): EfficiencyVsSpeedItem[] => {
    const statsByName = new Map(modelStatistics.map((s) => [s.model, s]));
    return costEfficiency
      .slice(0, 30)
      .map((item) => {
        const stats = statsByName.get(item.model);
        const raw =
          Math.max(...costEfficiency.map((i) => i.cost_per_1k_tokens)) /
          Math.max(item.cost_per_1k_tokens, 0.0001);
        return {
          model: item.model,
          efficiency_score: Math.round(raw * 100) / 100,
          cost_per_1k_tokens: item.cost_per_1k_tokens,
          avg_tokens_per_second: stats?.avg_tokens_per_second ?? 0,
          total_tokens: item.total_tokens,
        };
      })
      .filter((d) => d.avg_tokens_per_second > 0);
  }, [costEfficiency, modelStatistics]);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Efficiency vs Speed ({rangeLabel})</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-80 w-full" />
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            No speed data available for these models
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid />
              <XAxis
                type="number"
                dataKey="efficiency_score"
                name="Efficiency"
                label={{
                  value: "Efficiency Score (× cheaper)",
                  position: "insideBottom",
                  offset: -10,
                }}
              />
              <YAxis
                type="number"
                dataKey="avg_tokens_per_second"
                name="Speed"
                label={{
                  value: "Avg Tokens / Second",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]
                    ?.payload as EfficiencyVsSpeedItem | null;
                  if (!d) return null;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                      <div className="font-medium">{d.model}</div>
                      <div>
                        Efficiency: {d.efficiency_score.toFixed(2)}× cheaper
                      </div>
                      <div>
                        Speed: {formatNumber(d.avg_tokens_per_second)} tok/s
                      </div>
                      <div>
                        Cost: ${formatCost(d.cost_per_1k_tokens)}/1K tokens
                      </div>
                    </div>
                  );
                }}
              />
              <Scatter
                name="Models"
                data={chartData}
                fill="#8b5cf6"
              />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
