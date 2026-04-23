import { Badge } from '../components/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/card';
import { ChartTooltipContent } from '../components/chart-tooltip';
import { Skeleton } from '../components/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/table';
import { useDashboardData } from '../hooks/use-dashboard-data';
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function DashboardPage() {
  const {
    metrics,
    spendByUser,
    dailyTrend,
    loading,
    error,
    tokenDistribution,
    performance,
    hourlyPatterns,
    apiKeyStats,
    costEfficiency,
    modelDistribution,
    dailyTokenTrend,
  } = useDashboardData();

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">LiteLLM Statistics</h1>
        <Badge variant="outline">Auto-refresh: 30s</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Spend (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">
                {formatCurrency(metrics?.totalSpend || 0)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Tokens (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">
                {formatNumber(metrics?.totalTokens || 0)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Models</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-bold">{metrics?.activeModels || 0}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Errors (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-bold">{metrics?.errorCount || 0}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">
                {formatNumber(performance?.total_requests || 0)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">
                {formatDuration(performance?.avg_duration_ms || 0)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className={`text-2xl font-bold ${
                (performance?.success_rate || 0) > 95 ? 'text-green-600' :
                (performance?.success_rate || 0) > 90 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {formatPercent(performance?.success_rate || 0)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Tokens/Request</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">
                {formatNumber(
                  tokenDistribution.reduce((sum, m) => sum + m.avg_tokens_per_request, 0) /
                  (tokenDistribution.length || 1)
                )}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

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
                  <Tooltip content={<ChartTooltipContent />} formatter={(v) => formatNumber(Number(v))} />
                  <Legend />
                  <Bar dataKey="prompt_tokens" name="Input Tokens" fill="#3b82f6" stackId="a" />
                  <Bar dataKey="completion_tokens" name="Output Tokens" fill="#10b981" stackId="a" />
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
                  <Tooltip content={<ChartTooltipContent />} formatter={(v) => formatCurrency(Number(v))} />
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
                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {modelDistribution.slice(0, 8).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                <AreaChart data={Array.from({ length: 24 }, (_, i) => {
                  const hourData = hourlyPatterns.find(h => h.hour === i);
                  return {
                    hour: i,
                    requests: hourData?.request_count || 0,
                    spend: hourData?.total_spend || 0,
                  };
                })}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tickFormatter={(v) => `${v}:00`} />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip content={<ChartTooltipContent />} formatter={(v) => formatNumber(Number(v))} />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cost Efficiency by Model ($/1K tokens)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={costEfficiency.slice(0, 10)}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `$${v.toFixed(2)}`} />
                  <YAxis
                    dataKey="model"
                    type="category"
                    width={120}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip content={<ChartTooltipContent />} formatter={(v) => `$${Number(v).toFixed(4)}`} />
                  <Bar dataKey="cost_per_1k_tokens" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token Trend (Input vs Output)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyTokenTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip content={<ChartTooltipContent />} formatter={(v) => formatNumber(Number(v))} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="prompt_tokens"
                    name="Input"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                  />
                  <Area
                    type="monotone"
                    dataKey="completion_tokens"
                    name="Output"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top API Keys (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>API Key</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Success</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  : apiKeyStats.slice(0, 10).map((k, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">
                          {k.key.slice(0, 12)}...
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(k.request_count)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(k.total_spend)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(k.total_tokens)}
                        </TableCell>
                        <TableCell className={`text-right ${
                          k.success_rate > 95 ? 'text-green-600' :
                          k.success_rate > 90 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {formatPercent(k.success_rate)}
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Users (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Total Spend</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  : spendByUser.slice(0, 10).map((u, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          {u.user || 'Anonymous'}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(u.total_spend)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(u.total_tokens)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(
                            tokenDistribution.reduce((sum, m) => sum + (m.avg_tokens_per_request || 0), 0)
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;