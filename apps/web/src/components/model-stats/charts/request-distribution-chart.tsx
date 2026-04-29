import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS, CHART_HEIGHT } from "@/lib/chart-colors";
import { formatNumber } from "@/pages/model-stats/model-stats-utils";
import type { ModelDistribution } from "@/types/analytics";
import { ChartTooltipContent } from "../../ui/chart-tooltip";
import { ChartCard } from "./chart-card";

type RequestDistributionChartProps = {
  loading: boolean;
  modelDistribution: ModelDistribution[];
  rangeLabel: string;
};

export function RequestDistributionChart({
  loading,
  modelDistribution,
  rangeLabel,
}: RequestDistributionChartProps) {
  const sliced = modelDistribution.slice(0, 6);

  return (
    <ChartCard
      title={`Request Distribution (${rangeLabel})`}
      loading={loading}
      hasData={modelDistribution.length > 0}
    >
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <PieChart>
          <Pie
            data={sliced}
            dataKey="request_count"
            nameKey="model"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, payload }) =>
              `${name}: ${Number(payload?.percentage ?? 0).toFixed(1)}%`
            }
            labelLine={false}
          >
            {sliced.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            content={<ChartTooltipContent />}
            formatter={(value, _name, item) => {
              const pct = Number(item?.payload?.percentage ?? 0);
              return `${formatNumber(Number(value))} (${pct.toFixed(1)}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
