import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  CostEfficiency,
  ModelDistribution,
  TokenDistribution,
} from '../../types/analytics';
import {
  formatCurrency,
  formatNumber,
} from '../../pages/model-stats/model-stats-utils';
import { Card, CardContent, CardHeader, CardTitle } from '../card';
import { ChartTooltipContent } from '../chart-tooltip';
import { Skeleton } from '../skeleton';
import {
  CHART_HEIGHT,
  MODEL_STATS_CHART_COLORS,
  TOP_N_MODELS,
} from '../../pages/model-stats/model-stats-chart-utils';

type ModelStatsChartsProps = {
  loading: boolean;
  tokenDistribution: TokenDistribution[];
  modelDistribution: ModelDistribution[];
  costEfficiency: CostEfficiency[];
};

export function ModelStatsCharts({
  loading,
  tokenDistribution,
  modelDistribution,
  costEfficiency,
}: ModelStatsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Token Distribution by Model</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : tokenDistribution.length > 0 ? (
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
                  fill={MODEL_STATS_CHART_COLORS[0]}
                  stackId="a"
                  maxBarSize={30}
                />
                <Bar
                  dataKey="completion_tokens"
                  name="Output Tokens"
                  fill={MODEL_STATS_CHART_COLORS[1]}
                  stackId="a"
                  maxBarSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cost Efficiency ($/1K tokens)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : costEfficiency.length > 0 ? (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart
                data={costEfficiency.slice(0, TOP_N_MODELS)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `$${v.toFixed(2)}`}
                />
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
                <Bar
                  dataKey="cost_per_1k_tokens"
                  fill={MODEL_STATS_CHART_COLORS[2]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : modelDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <PieChart>
                <Pie
                  data={modelDistribution.slice(0, 6)}
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
                  {modelDistribution.slice(0, 6).map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        MODEL_STATS_CHART_COLORS[
                          index % MODEL_STATS_CHART_COLORS.length
                        ]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(value, _name, item) => {
                    const pct = Number(
                      item?.payload?.percentage ?? 0,
                    );
                    return `${formatNumber(Number(value))} (${pct.toFixed(1)}%)`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spend by Model</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : costEfficiency.length > 0 ? (
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
                <Bar
                  dataKey="total_spend"
                  fill={MODEL_STATS_CHART_COLORS[0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
