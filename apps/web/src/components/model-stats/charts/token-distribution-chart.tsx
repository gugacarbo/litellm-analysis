import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, CHART_HEIGHT } from "@/lib/chart-colors";
import { TOP_N_MODELS } from "@/pages/model-stats/model-stats-chart-utils";
import { formatNumber } from "@/pages/model-stats/model-stats-utils";
import type { TokenDistribution } from "@/types/analytics";
import { ChartTooltipContent } from "../../chart-tooltip";
import { ChartCard } from "./chart-card";

type TokenDistributionChartProps = {
  loading: boolean;
  tokenDistribution: TokenDistribution[];
  rangeLabel: string;
};

export function TokenDistributionChart({
  loading,
  tokenDistribution,
  rangeLabel,
}: TokenDistributionChartProps) {
  return (
    <ChartCard
      title={`Token Distribution by Model (${rangeLabel})`}
      loading={loading}
      hasData={tokenDistribution.length > 0}
    >
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <BarChart
          data={tokenDistribution.slice(0, TOP_N_MODELS)}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={formatNumber} />
          <YAxis
            dataKey="model"
            type="category"
            width={150}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            content={<ChartTooltipContent />}
            formatter={(v) => formatNumber(Number(v))}
          />
          <Legend />
          <Bar
            dataKey="prompt_tokens"
            name="Input Tokens"
            fill={CHART_COLORS[0]}
            stackId="a"
            maxBarSize={30}
          />
          <Bar
            dataKey="completion_tokens"
            name="Output Tokens"
            fill={CHART_COLORS[1]}
            stackId="a"
            maxBarSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
