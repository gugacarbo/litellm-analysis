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
import { CHART_HEIGHT, LATENCY_COLORS } from "@/lib/chart-colors";
import { TOP_N_MODELS } from "@/pages/model-stats/model-stats-chart-utils";
import type { ModelStats } from "@/pages/model-stats/model-stats-types";
import { formatDuration } from "@/pages/model-stats/model-stats-utils";
import { ChartTooltipContent } from "../../chart-tooltip";
import { ChartCard } from "./chart-card";

type LatencyChartProps = {
  loading: boolean;
  sortedData: ModelStats[];
  rangeLabel: string;
};

export function LatencyChart({
  loading,
  sortedData,
  rangeLabel,
}: LatencyChartProps) {
  const data = sortedData
    .filter((m) => m.p50_latency_ms > 0)
    .slice(0, TOP_N_MODELS)
    .map((m) => ({
      model: m.model,
      p50: m.p50_latency_ms,
      p95: m.p95_latency_ms,
      p99: m.p99_latency_ms,
    }));

  return (
    <ChartCard
      title={`Latency Percentiles (${rangeLabel})`}
      loading={loading}
      hasData={data.length > 0}
    >
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            tickFormatter={(v) => formatDuration(Number(v))}
          />
          <YAxis
            dataKey="model"
            type="category"
            width={150}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            content={<ChartTooltipContent />}
            formatter={(v) => formatDuration(Number(v))}
          />
          <Legend />
          <Bar
            dataKey="p50"
            name="P50"
            fill={LATENCY_COLORS.p50}
            maxBarSize={20}
          />
          <Bar
            dataKey="p95"
            name="P95"
            fill={LATENCY_COLORS.p95}
            maxBarSize={20}
          />
          <Bar
            dataKey="p99"
            name="P99"
            fill={LATENCY_COLORS.p99}
            maxBarSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
