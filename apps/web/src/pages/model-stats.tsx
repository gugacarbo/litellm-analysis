import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import { Button } from '../components/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/alert-dialog';
import { getModelStatistics, deleteModelLogs, mergeModels } from '../lib/api-client';
import { Toaster } from '../components/sonner';
import { ChevronDownIcon } from 'lucide-react';

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

type ColumnKey = 'model' | 'requests' | 'spend' | 'percent' | 'tokens' | 'prompt' | 'output' | 'avgTok' | 'latency' | 'p50' | 'p95' | 'p99' | 'success' | 'errors' | 'users' | 'keys' | 'first' | 'last' | 'actions';

interface Column {
  key: ColumnKey;
  label: string;
  sortable?: SortField;
  align?: 'left' | 'right';
  default: boolean;
}

const columns: Column[] = [
  { key: 'model', label: 'Model', default: true },
  { key: 'requests', label: 'Requests', sortable: 'request_count', align: 'right', default: true },
  { key: 'spend', label: 'Spend', sortable: 'total_spend', align: 'right', default: true },
  { key: 'percent', label: '% Total', align: 'right', default: true },
  { key: 'tokens', label: 'Tokens', sortable: 'total_tokens', align: 'right', default: true },
  { key: 'prompt', label: 'Prompt', align: 'right', default: false },
  { key: 'output', label: 'Output', align: 'right', default: false },
  { key: 'avgTok', label: 'Avg Tok/Req', align: 'right', default: true },
  { key: 'latency', label: 'Latency (avg)', sortable: 'avg_latency_ms', align: 'right', default: false },
  { key: 'p50', label: 'Latency (p50)', align: 'right', default: false },
  { key: 'p95', label: 'Latency (p95)', align: 'right', default: false },
  { key: 'p99', label: 'Latency (p99)', align: 'right', default: false },
  { key: 'success', label: 'Success', sortable: 'success_rate', align: 'right', default: true },
  { key: 'errors', label: 'Errors', align: 'right', default: false },
  { key: 'users', label: 'Users', align: 'right', default: false },
  { key: 'keys', label: 'API Keys', align: 'right', default: false },
  { key: 'first', label: 'First Used', align: 'right', default: false },
  { key: 'last', label: 'Last Used', align: 'right', default: false },
  { key: 'actions', label: '', align: 'right', default: true },
];

export function ModelStatsPage() {
  const [data, setData] = useState<ModelStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('total_spend');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(() =>
    columns.filter((c) => c.default).map((c) => c.key)
  );
  const [mergeMode, setMergeMode] = useState(false);
  const [sourceModel, setSourceModel] = useState('');
  const [targetModel, setTargetModel] = useState('');
  const [merging, setMerging] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);

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

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const openDeleteDialog = (modelName: string) => {
    setDeleting(modelName);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    const modelName = deleting;
    if (!modelName) return;
    setDeleteDialogOpen(false);
    setDeleting(modelName);
    try {
      await deleteModelLogs(modelName);
      setData(data.filter((m) => m.model !== modelName));
      toast.success(`Deleted logs for model "${modelName}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const handleMerge = async () => {
    if (!sourceModel || !targetModel) {
      toast.warning('Please select both source and target models');
      return;
    }
    if (sourceModel === targetModel) {
      toast.warning('Source and target models must be different');
      return;
    }
    setMergeDialogOpen(true);
  };

  const confirmMerge = async () => {
    setMergeDialogOpen(false);
    setMerging(true);
    try {
      await mergeModels(sourceModel, targetModel);
      const result = await getModelStatistics();
      setData(result);
      setMergeMode(false);
      setSourceModel('');
      setTargetModel('');
      toast.success(`Merged logs from "${sourceModel}" into "${targetModel}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to merge');
    } finally {
      setMerging(false);
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
      <Toaster position="bottom-right" />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Model Logs</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all logs for model "{`${deleting}`}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleting(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Merge Model Logs</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to merge all logs from "{`${sourceModel}`}" into "{`${targetModel}`}"? This will update {data.find(m => m.model === sourceModel)?.request_count || 0} records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMerge}>Merge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Model Statistics</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline">30-day period</Badge>
            <Button size="sm" variant="outline" onClick={() => setMergeMode(!mergeMode)}>
              {mergeMode ? 'Cancel' : 'Merge Models'}
            </Button>
          </div>
        </div>

        {mergeMode && (
          <Card>
            <CardContent className="pt-4 flex items-center gap-2 flex-wrap">
              <Select value={sourceModel} onValueChange={setSourceModel}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Source model" />
                </SelectTrigger>
                <SelectContent>
                  {data.filter(m => m.model).map((m) => (
                    <SelectItem key={m.model} value={m.model} disabled={m.model === targetModel}>
                      {m.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>→</span>
              <Select value={targetModel} onValueChange={setTargetModel}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Target model" />
                </SelectTrigger>
                <SelectContent>
                  {data.filter(m => m.model).map((m) => (
                    <SelectItem key={m.model} value={m.model} disabled={m.model === sourceModel}>
                      {m.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="default"
                disabled={merging || !sourceModel || !targetModel}
                onClick={handleMerge}
              >
                {merging ? 'Merging...' : 'Merge'}
              </Button>
            </CardContent>
          </Card>
        )}

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
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Columns <ChevronDownIcon className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {columns.map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.key}
                      checked={visibleColumns.includes(col.key)}
                      onCheckedChange={() => toggleColumn(col.key)}
                    >
                      {col.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <input
                type="text"
                placeholder="Filter models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm w-48"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.filter(c => visibleColumns.includes(c.key)).map((col) => (
                    <TableHead
                      key={col.key}
                      className={col.align === 'right' ? 'cursor-pointer hover:text-primary text-right' : 'cursor-pointer hover:text-primary'}
                      onClick={() => col.sortable && handleSort(col.sortable)}
                    >
                      {col.label} {col.sortable && <SortIcon field={col.sortable} />}
                    </TableHead>
                  ))}
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
                          {columns.filter(c => visibleColumns.includes(c.key)).map((col) => {
                            const value = (() => {
                              switch (col.key) {
                                case 'model':
                                  return <span className="font-medium font-mono text-xs whitespace-nowrap">{m.model}</span>;
                                case 'requests':
                                  return formatNumber(m.request_count);
                                case 'spend':
                                  return formatCurrency(m.total_spend);
                                case 'percent':
                                  return `${percentOfTotal.toFixed(1)}%`;
                                case 'tokens':
                                  return formatNumber(m.total_tokens);
                                case 'prompt':
                                  return formatNumber(m.prompt_tokens);
                                case 'output':
                                  return formatNumber(m.completion_tokens);
                                case 'avgTok':
                                  return formatNumber(m.avg_tokens_per_request);
                                case 'latency':
                                  return formatDuration(m.avg_latency_ms);
                                case 'p50':
                                  return formatDuration(m.p50_latency_ms);
                                case 'p95':
                                  return formatDuration(m.p95_latency_ms);
                                case 'p99':
                                  return formatDuration(m.p99_latency_ms);
                                case 'success':
                                  return (
                                    <span className={
                                      Number(m.success_rate) > 95 ? 'text-green-600' :
                                      Number(m.success_rate) > 90 ? 'text-yellow-600' : 'text-red-600'
                                    }>
                                      {formatPercent(m.success_rate)}
                                    </span>
                                  );
                                case 'errors':
                                  return (
                                    <span className={Number(m.error_count) > 0 ? 'text-red-600' : ''}>
                                      {formatNumber(m.error_count)}
                                    </span>
                                  );
                                case 'users':
                                  return formatNumber(m.unique_users);
                                case 'keys':
                                  return formatNumber(m.unique_api_keys);
                                case 'first':
                                  return formatDate(m.first_seen);
                                case 'last':
                                  return formatDate(m.last_seen);
                                case 'actions':
                                  return (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      disabled={deleting === m.model}
                                      onClick={() => openDeleteDialog(m.model)}
                                    >
                                      {deleting === m.model ? '...' : '×'}
                                    </Button>
                                  );
                                default:
                                  return null;
                              }
                            })();
                            return (
                              <TableCell key={col.key} className={col.align === 'right' ? 'text-right' : ''}>
                                {value}
                              </TableCell>
                            );
                          })}
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