import type { CostEfficiency } from "@lite-llm/api-contracts/analytics";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, CHART_HEIGHT } from "@/lib/chart-colors";
import { TOP_N_MODELS } from "@/pages/model-stats/model-stats-chart-utils";
import { ChartTooltipContent } from "../../ui/chart-tooltip";
import { ChartCard } from "./chart-card";

type CostEfficiencyChartProps = {
  loading: boolean;
  costEfficiency: CostEfficiency[];
  rangeLabel: string;
};

export function CostEfficiencyChart({
  loading,
  costEfficiency,
  rangeLabel,
}: CostEfficiencyChartProps) {
  return (
    <ChartCard
      title={`Cost Efficiency ($/1K tokens) (${rangeLabel})`}
      loading={loading}
      hasData={costEfficiency.length > 0}
    >
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <BarChart
          data={costEfficiency.slice(0, TOP_N_MODELS)}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(v) => `$${v.toFixed(2)}`} />
          <YAxis
            dataKey="model"
            type="category"
            width={150}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            content={<ChartTooltipContent />}
            formatter={(v) => `$${Number(v).toFixed(4)}`}
          />
          <Bar dataKey="cost_per_1k_tokens" fill={CHART_COLORS[2]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
