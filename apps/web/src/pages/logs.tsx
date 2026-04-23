import { Clock, DollarSign, Key, User, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '../components/badge';
import { Button } from '../components/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/dialog';
import { FeatureGate } from '../components/feature-gate';
import { Input } from '../components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/select';
import { Skeleton } from '../components/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/table';
import { UnavailableFeature } from '../components/unavailable-feature';
import { useLogs } from '../hooks/use-logs';
import { useServerMode } from '../hooks/use-server-mode';
import { getAllModels } from '../lib/api-client';
import type { SpendLog } from '../types/analytics';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFullDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function calculateTokensPerSecond(
  completionTokens: number,
  startTime: string,
  endTime: string,
): string {
  const durationMs =
    new Date(endTime).getTime() - new Date(startTime).getTime();
  if (durationMs <= 0 || !completionTokens) return '-';
  const tokensPerSec = completionTokens / (durationMs / 1000);
  return `${tokensPerSec.toFixed(1)}/s`;
}

function maskApiKey(key: string): string {
  if (!key) return 'N/A';
  if (key.length <= 8) return key;
  return `${key.substring(0, 6)}...${key.slice(-4)}`;
}

function DetailRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={mono ? 'font-mono text-sm break-all' : 'text-sm'}>
          {value}
        </div>
      </div>
    </div>
  );
}

function LogDetailDialog({
  log,
  open,
  onOpenChange,
}: {
  log: SpendLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!log) return null;

  const durationMs =
    new Date(log.end_time).getTime() - new Date(log.start_time).getTime();
  const tokensPerSec = calculateTokensPerSecond(
    log.completion_tokens,
    log.start_time,
    log.end_time,
  );
  const isSuccess = log.status === '200' || log.status === 'success';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {log.model}
            <Badge variant={isSuccess ? 'default' : 'destructive'}>
              {log.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>Request details</DialogDescription>
        </DialogHeader>

        <div className="grid gap-0 divide-y divide-border">
          <DetailRow icon={User} label="User" value={log.user || 'N/A'} />
          <DetailRow
            icon={Key}
            label="API Key"
            value={maskApiKey(log.api_key)}
            mono
          />
          <DetailRow
            icon={Clock}
            label="Start Time"
            value={formatFullDateTime(log.start_time)}
          />
          <DetailRow
            icon={Clock}
            label="End Time"
            value={formatFullDateTime(log.end_time)}
          />
          <DetailRow
            icon={Clock}
            label="Duration"
            value={formatDuration(durationMs)}
          />

          <DetailRow
            icon={Zap}
            label="Prompt Tokens"
            value={formatNumber(log.prompt_tokens)}
          />
          <DetailRow
            icon={Zap}
            label="Completion Tokens"
            value={formatNumber(log.completion_tokens)}
          />
          <DetailRow
            icon={Zap}
            label="Total Tokens"
            value={formatNumber(log.total_tokens)}
          />
          <DetailRow icon={Zap} label="Tokens/Second" value={tokensPerSec} />

          <DetailRow
            icon={DollarSign}
            label="Spend"
            value={formatCurrency(log.spend)}
          />

          <DetailRow
            icon={Key}
            label="Request ID"
            value={log.request_id}
            mono
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function LogsPage() {
  const {
    logs,
    pagination,
    loading,
    error,
    page,
    pageSize,
    filters,
    setPage,
    setPageSize,
    setFilters,
  } = useLogs();
  const { mode } = useServerMode();
  const [models, setModels] = useState<string[]>([]);
  const [filterValues, setFilterValues] = useState({
    model: filters.model || '',
    user: filters.user || '',
    startDate: filters.startDate || '',
    endDate: filters.endDate || '',
  });
  const [selectedLog, setSelectedLog] = useState<SpendLog | null>(null);

  // Load models for the model dropdown
  useEffect(() => {
    async function fetchModels() {
      try {
        const modelConfigs = await getAllModels();
        const modelNames = modelConfigs.map((config) => config.modelName);
        setModels(modelNames);
      } catch (err) {
        console.error('Failed to fetch models:', err);
      }
    }

    fetchModels();
  }, []);

  const handleApplyFilters = () => {
    setFilters({
      model: filterValues.model || undefined,
      user: filterValues.user || undefined,
      startDate: filterValues.startDate || undefined,
      endDate: filterValues.endDate || undefined,
    });
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilterValues({
      model: '',
      user: '',
      startDate: '',
      endDate: '',
    });
    setFilters({});
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPage(newPage);
    }
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number(newPageSize));
    setPage(1);
  };

  return (
    <FeatureGate
      capability="spendLogs"
      fallback={<UnavailableFeature capability="spendLogs" />}
    >
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Spend Logs</h1>
          <Badge
            variant={mode === 'database' ? 'default' : 'secondary'}
            className="bg-green-100 text-green-800"
          >
            {mode === 'database' ? 'Database Mode' : 'API-Only Mode'}
          </Badge>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <Select
              value={filterValues.model}
              onValueChange={(value) =>
                setFilterValues({ ...filterValues, model: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="User"
              value={filterValues.user}
              onChange={(e) =>
                setFilterValues({ ...filterValues, user: e.target.value })
              }
            />

            <Input
              type="date"
              placeholder="Start Date"
              value={filterValues.startDate}
              onChange={(e) =>
                setFilterValues({ ...filterValues, startDate: e.target.value })
              }
            />

            <Input
              type="date"
              placeholder="End Date"
              value={filterValues.endDate}
              onChange={(e) =>
                setFilterValues({ ...filterValues, endDate: e.target.value })
              }
            />

            <div className="flex gap-2">
              <Button onClick={handleApplyFilters}>Apply</Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              Error: {error}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Prompt Tokens</TableHead>
                  <TableHead className="text-right">
                    Completion Tokens
                  </TableHead>
                  <TableHead className="text-right">Total Tokens</TableHead>
                  <TableHead className="text-right">Duration (ms)</TableHead>
                  <TableHead className="text-right">Tokens/s</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-12 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-12 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-12 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-12 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-12 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-12 ml-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="text-center text-muted-foreground"
                    >
                      No logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log: SpendLog) => {
                    const durationMs =
                      new Date(log.end_time).getTime() -
                      new Date(log.start_time).getTime();

                    return (
                      <TableRow key={log.request_id}>
                        <TableCell className="text-sm">
                          {formatDateTime(log.start_time)}
                        </TableCell>
                        <TableCell>{log.model}</TableCell>
                        <TableCell>{log.user || '-'}</TableCell>
                        <TableCell className="text-right">
                          {formatNumber(log.prompt_tokens)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(log.completion_tokens)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(log.total_tokens)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatDuration(durationMs)}
                        </TableCell>
                        <TableCell className="text-right">
                          {calculateTokensPerSecond(
                            log.completion_tokens,
                            log.start_time,
                            log.end_time,
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(log.spend)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              log.status === '200' || log.status === 'success'
                                ? 'default'
                                : 'destructive'
                            }
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1}-
                {Math.min(page * pageSize, pagination.total)} of{' '}
                {pagination.total} entries
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>

                <span className="text-sm px-2">
                  Page {page} of {pagination.total_pages || 1}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= (pagination.total_pages || 1)}
                >
                  Next
                </Button>

                <Select
                  value={pageSize.toString()}
                  onValueChange={handlePageSizeChange}
                >
                  <SelectTrigger className="w-[90px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25/page</SelectItem>
                    <SelectItem value="50">50/page</SelectItem>
                    <SelectItem value="100">100/page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <LogDetailDialog
        log={selectedLog}
        open={selectedLog !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null);
        }}
      />
    </FeatureGate>
  );
}
