import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/card';
import { Skeleton } from '../components/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/table';
import { Badge } from '../components/badge';
import { getModelStatistics } from '../lib/api-client';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatDuration(ms: number): string {
  if (!ms || Number.isNaN(ms)) return '-';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatPercent(value: number): string {
  if (!value || Number.isNaN(value)) return '-';
  return `${value.toFixed(1)}%`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface ModelStats {
  model: string;
  request_count: number;
  total_spend: number;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  avg_tokens_per_request: number;
  avg_latency_ms: number;
  success_rate: number;
  error_count: number;
  avg_input_cost: number;
  avg_output_cost: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  first_seen: string;
  last_seen: string;
  unique_users: number;
  unique_api_keys: number;
}

type SortField = 'model' | 'request_count' | 'total_spend' | 'total_tokens' | 'avg_latency_ms' | 'success_rate';
type SortDirection = 'asc' | 'desc';

export function ModelStatsPage() {
  const [data, setData] = useState<ModelStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('total_spend');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getModelStatistics();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection(field === 'model' ? 'asc' : 'desc');
    }
  };

  const filteredData = data.filter((m) =>
    m.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return sortDirection === 'asc'
      ? Number(aVal) - Number(bVal)
      : Number(bVal) - Number(aVal);
  });

  const totalSpend = data.reduce((sum, m) => sum + Number(m.total_spend), 0);
  const totalRequests = data.reduce((sum, m) => sum + Number(m.request_count), 0);
  const totalTokens = data.reduce((sum, m) => sum + Number(m.total_tokens), 0);
  const avgSuccessRate = totalRequests > 0
    ? data.reduce((sum, m) => sum + Number(m.success_rate) * Number(m.request_count), 0) / totalRequests
    : 0;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

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
        <h1 className="text-3xl font-bold">Model Statistics</h1>
        <Badge variant="outline">30-day period</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">{formatCurrency(totalSpend)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">{formatNumber(totalRequests)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">{formatNumber(totalTokens)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className={`text-2xl font-bold ${
                avgSuccessRate > 95 ? 'text-green-600' :
                avgSuccessRate > 90 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {formatPercent(avgSuccessRate)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Models (30-day detailed stats)</CardTitle>
            <input
              type="text"
              placeholder="Filter models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm w-48"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:text-primary"
                    onClick={() => handleSort('model')}
                  >
                    Model <SortIcon field="model" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-primary text-right"
                    onClick={() => handleSort('request_count')}
                  >
                    Requests <SortIcon field="request_count" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-primary text-right"
                    onClick={() => handleSort('total_spend')}
                  >
                    Spend <SortIcon field="total_spend" />
                  </TableHead>
                  <TableHead className="text-right">% Total</TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-primary text-right"
                    onClick={() => handleSort('total_tokens')}
                  >
                    Tokens <SortIcon field="total_tokens" />
                  </TableHead>
                  <TableHead className="text-right">Prompt</TableHead>
                  <TableHead className="text-right">Output</TableHead>
                  <TableHead className="text-right">Avg Tok/Req</TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-primary text-right"
                    onClick={() => handleSort('avg_latency_ms')}
                  >
                    Latency (avg) <SortIcon field="avg_latency_ms" />
                  </TableHead>
                  <TableHead className="text-right">Latency (p50)</TableHead>
                  <TableHead className="text-right">Latency (p95)</TableHead>
                  <TableHead className="text-right">Latency (p99)</TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-primary text-right"
                    onClick={() => handleSort('success_rate')}
                  >
                    Success <SortIcon field="success_rate" />
                  </TableHead>
                  <TableHead className="text-right">Errors</TableHead>
                  <TableHead className="text-right">Users</TableHead>
                  <TableHead className="text-right">API Keys</TableHead>
                  <TableHead className="text-right">First Used</TableHead>
                  <TableHead className="text-right">Last Used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  : sortedData.map((m, i) => {
                      const percentOfTotal = totalSpend > 0
                        ? (Number(m.total_spend) / totalSpend * 100)
                        : 0;
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-medium font-mono text-xs whitespace-nowrap">
                            {m.model}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(m.request_count)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(m.total_spend)}
                          </TableCell>
                          <TableCell className="text-right">
                            {percentOfTotal.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(m.total_tokens)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(m.prompt_tokens)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(m.completion_tokens)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(m.avg_tokens_per_request)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatDuration(m.avg_latency_ms)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatDuration(m.p50_latency_ms)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatDuration(m.p95_latency_ms)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatDuration(m.p99_latency_ms)}
                          </TableCell>
                          <TableCell className={`text-right ${
                            Number(m.success_rate) > 95 ? 'text-green-600' :
                            Number(m.success_rate) > 90 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {formatPercent(m.success_rate)}
                          </TableCell>
                          <TableCell className={`text-right ${
                            Number(m.error_count) > 0 ? 'text-red-600' : ''
                          }`}>
                            {formatNumber(m.error_count)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(m.unique_users)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(m.unique_api_keys)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatDate(m.first_seen)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatDate(m.last_seen)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Models by Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  : data.slice(0, 5).map((m, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{m.model}</TableCell>
                        <TableCell className="text-right">{formatCurrency(m.total_spend)}</TableCell>
                        <TableCell className="text-right">
                          {totalSpend > 0
                            ? (Number(m.total_spend) / totalSpend * 100).toFixed(1)
                            : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Models by Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  : [...data]
                      .sort((a, b) => Number(b.request_count) - Number(a.request_count))
                      .slice(0, 5)
                      .map((m, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-xs">{m.model}</TableCell>
                          <TableCell className="text-right">{formatNumber(m.request_count)}</TableCell>
                          <TableCell className="text-right">
                            {totalRequests > 0
                              ? (Number(m.request_count) / totalRequests * 100).toFixed(1)
                              : 0}%
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

export default ModelStatsPage;