import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CostEfficiencyItem } from "@/features/dashboard/types/dashboard-types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { ChartTooltipContent } from "@/shared/components/ui/chart-tooltip";
import { Skeleton } from "@/shared/components/ui/skeleton";

type ModelEfficiencyChartProps = {
  loading: boolean;
  costEfficiency: CostEfficiencyItem[];
};

/** Format cost per 1K tokens with 4-5 decimal places and at most 1 trailing zero */
function formatCost(n: number): string {
  const fixed = n.toFixed(5);
  const stripped = fixed.replace(/0+$/, "");
  const dotIdx = stripped.indexOf(".");
  const decLen = dotIdx === -1 ? 0 : stripped.length - dotIdx - 1;
  if (decLen < 4) return n.toFixed(4);
  return stripped;
}

export function ModelEfficiencyChart({
  loading,
  costEfficiency,
}: ModelEfficiencyChartProps) {
  const avgCostPer1k = useMemo(() => {
    if (costEfficiency.length === 0) return 0;
    return (
      costEfficiency.reduce((s, i) => s + i.cost_per_1k_tokens, 0) /
      costEfficiency.length
    );
  }, [costEfficiency]);

  const chartData = useMemo(() => {
    if (costEfficiency.length === 0) return [];
    const items = costEfficiency.slice(0, 10);
    const maxCost = Math.max(...items.map((i) => i.cost_per_1k_tokens));
    return items
      .map((item) => {
        const raw = maxCost / Math.max(item.cost_per_1k_tokens, 0.0001);
        return {
          ...item,
          efficiency_score: Math.round(raw * 100) / 100,
        };
      })
      .sort((a, b) => b.efficiency_score - a.efficiency_score);
  }, [costEfficiency]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Model Efficiency — estimated from $/1K tokens (avg $
          {formatCost(avgCostPer1k)}/1K)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                tickFormatter={(v) => `${v.toFixed(1)}x`}
                label={{
                  value: "Efficiency Score (# cheaper than most expensive)",
                  position: "insideBottom",
                  offset: -5,
                  style: { fontSize: 12 },
                }}
              />
              <YAxis
                dataKey="model"
                type="category"
                width={120}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={<ChartTooltipContent />}
                formatter={(
                  _value,
                  name,
                  props: {
                    payload?: CostEfficiencyItem & {
                      efficiency_score: number;
                    };
                  },
                ) => {
                  const data = props?.payload;
                  if (name === "Efficiency" && data) {
                    return `${data.efficiency_score.toFixed(
                      2,
                    )}x cheaper — $${formatCost(
                      data.cost_per_1k_tokens,
                    )}/1K tokens`;
                  }
                  return _value;
                }}
              />
              <Bar
                dataKey="efficiency_score"
                fill="#10b981"
                name="Efficiency"
                radius={[0, 4, 4, 0]}
              >
                <LabelList
                  dataKey="cost_per_1k_tokens"
                  position="right"
                  formatter={(v: unknown) => `$${formatCost(Number(v))}/1K`}
                  style={{ fontSize: 10, fill: "#6b7280" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
