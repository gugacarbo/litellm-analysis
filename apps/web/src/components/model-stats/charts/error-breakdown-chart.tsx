import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_HEIGHT } from "@/lib/chart-colors";
import { TOP_N_MODELS } from "@/pages/model-stats/model-stats-chart-utils";
import type { ModelStats } from "@/pages/model-stats/model-stats-types";
import { formatNumber } from "@/pages/model-stats/model-stats-utils";
import { ChartTooltipContent } from "../../chart-tooltip";
import { ChartCard } from "./chart-card";

type ErrorBreakdownChartProps = {
  loading: boolean;
  sortedData: ModelStats[];
  rangeLabel: string;
};

export function ErrorBreakdownChart({
  loading,
  sortedData,
  rangeLabel,
}: ErrorBreakdownChartProps) {
  const data = sortedData
    .filter((m) => m.error_count > 0)
    .sort((a, b) => b.error_count - a.error_count)
    .slice(0, TOP_N_MODELS)
    .map((m) => ({
      model: m.model,
      errors: m.error_count,
      success_rate: Number(m.success_rate),
    }));

  return (
    <ChartCard
      title={`Error Breakdown (${rangeLabel})`}
      loading={loading}
      hasData={data.length > 0}
    >
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
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
          <Bar
            dataKey="errors"
            name="Error Count"
            fill="#ef4444"
            maxBarSize={30}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.success_rate < 90
                    ? "#ef4444"
                    : entry.success_rate < 95
                      ? "#f59e0b"
                      : "#10b981"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
