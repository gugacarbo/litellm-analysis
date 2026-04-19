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

interface ErrorLog {
  id: string;
  error_type: string;
  model: string;
  user: string;
  error_message: string;
  timestamp: string;
  status_code: number;
}

const API_BASE = '/api';

async function fetchErrorLogs(limit = 100): Promise<ErrorLog[]> {
  const response = await fetch(`${API_BASE}/errors?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusColor(code: number): string {
  if (code >= 500) return 'bg-red-100 text-red-800';
  if (code >= 400) return 'bg-orange-100 text-orange-800';
  return 'bg-yellow-100 text-yellow-800';
}

function getErrorTypeColor(type: string): string {
  const t = type?.toLowerCase() || '';
  if (t.includes('rate')) return 'bg-purple-100 text-purple-800';
  if (t.includes('timeout')) return 'bg-yellow-100 text-yellow-800';
  if (t.includes('auth') || t.includes('key')) return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
}

export function ErrorsPage() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchErrors() {
      try {
        const data = await fetchErrorLogs(100);
        setErrors(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch errors');
      } finally {
        setLoading(false);
      }
    }
    fetchErrors();
  }, []);

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
        <h1 className="text-3xl font-bold">Error Logs</h1>
        <Badge variant="outline">{errors.length} errors</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : (
              <p className="text-2xl font-bold">{errors.length}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">5xx Errors</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : (
              <p className="text-2xl font-bold text-red-600">
                {errors.filter(e => e.status_code >= 500).length}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">4xx Errors</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : (
              <p className="text-2xl font-bold text-orange-600">
                {errors.filter(e => e.status_code >= 400 && e.status_code < 500).length}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unique Models</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : (
              <p className="text-2xl font-bold">
                {new Set(errors.map(e => e.model)).size}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  </TableRow>
                ))
              ) : errors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No errors found
                  </TableCell>
                </TableRow>
              ) : (
                errors.map((err) => (
                  <TableRow key={err.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDateTime(err.timestamp || '')}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(err.status_code)}`}>
                        {err.status_code || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${getErrorTypeColor(err.error_type)}`}>
                        {err.error_type || 'Error'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{err.model || '-'}</TableCell>
                    <TableCell className="text-sm">{err.user || '-'}</TableCell>
                    <TableCell className="max-w-md text-sm">
                      <span title={err.error_message}>
                        {err.error_message?.length > 80 
                          ? err.error_message.slice(0, 80) + '...' 
                          : err.error_message || '-'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
