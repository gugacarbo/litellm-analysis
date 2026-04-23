import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  DailyTrendItem,
  HourlyPatternItem,
  ModelDistributionItem,
  TokenDistributionItem,
} from '../../pages/dashboard/dashboard-types';
import {
  formatCurrency,
  formatDate,
  formatNumber,
} from '../../pages/dashboard/dashboard-utils';
import { Card, CardContent, CardHeader, CardTitle } from '../card';
import { ChartTooltipContent } from '../chart-tooltip';
import { Skeleton } from '../skeleton';

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

type DashboardUsageChartsProps = {
  loading: boolean;
  tokenDistribution: TokenDistributionItem[];
  dailyTrend: DailyTrendItem[];
  modelDistribution: ModelDistributionItem[];
  hourlyPatterns: HourlyPatternItem[];
};

export function DashboardUsageCharts({
  loading,
  tokenDistribution,
  dailyTrend,
  modelDistribution,
  hourlyPatterns,
}: DashboardUsageChartsProps) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Token Distribution by Model (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={tokenDistribution.slice(0, 10)}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={formatNumber} />
                  <YAxis
                    dataKey="model"
                    type="category"
                    width={120}
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
                    fill="#3b82f6"
                    stackId="a"
                  />
                  <Bar
                    dataKey="completion_tokens"
                    name="Output Tokens"
                    fill="#10b981"
                    stackId="a"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Spend Trend (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    content={<ChartTooltipContent />}
                    formatter={(v) => formatCurrency(Number(v))}
                  />
                  <Line
                    type="monotone"
                    dataKey="spend"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Model Usage Distribution (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={modelDistribution.slice(0, 8)}
                    dataKey="request_count"
                    nameKey="model"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`
                    }
                    labelLine={false}
                  >
                    {modelDistribution.slice(0, 8).map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hourly Usage Pattern (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={Array.from({ length: 24 }, (_, i) => {
                    const hourData = hourlyPatterns.find((h) => h.hour === i);
                    return {
                      hour: i,
                      requests: hourData?.request_count || 0,
                      spend: hourData?.total_spend || 0,
                    };
                  })}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tickFormatter={(v) => `${v}:00`} />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip
                    content={<ChartTooltipContent />}
                    formatter={(v) => formatNumber(Number(v))}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
