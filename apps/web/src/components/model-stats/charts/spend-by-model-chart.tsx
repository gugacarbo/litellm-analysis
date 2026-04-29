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
import { formatCurrency } from "@/pages/model-stats/model-stats-utils";
import { ChartTooltipContent } from "../../ui/chart-tooltip";
import { ChartCard } from "./chart-card";

type SpendByModelChartProps = {
  loading: boolean;
  costEfficiency: CostEfficiency[];
  rangeLabel: string;
};

export function SpendByModelChart({
  loading,
  costEfficiency,
  rangeLabel,
}: SpendByModelChartProps) {
  return (
    <ChartCard
      title={`Spend by Model (${rangeLabel})`}
      loading={loading}
      hasData={costEfficiency.length > 0}
    >
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <BarChart
          data={costEfficiency.slice(0, TOP_N_MODELS)}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            tickFormatter={(v) => formatCurrency(Number(v))}
          />
          <YAxis
            dataKey="model"
            type="category"
            width={150}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            content={<ChartTooltipContent />}
            formatter={(v) => formatCurrency(Number(v))}
          />
          <Bar dataKey="total_spend" fill={CHART_COLORS[0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
