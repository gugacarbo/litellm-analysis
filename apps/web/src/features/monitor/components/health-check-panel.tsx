import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  getHealthCheckSummary,
  getLatestHealthChecks,
  type HealthCheckResult,
  runHealthCheck,
} from "@/shared/lib/api-client/health-check";
import { queryKeys } from "@/shared/lib/query-keys";
import { formatTimestamp } from "../utils/monitor-utils";

type HealthCheckStatus = HealthCheckResult["status"];

type HealthCheckPanelProps = {
  active: boolean;
};

const STATUS_LABELS: Record<HealthCheckStatus, string> = {
  healthy: "Healthy",
  unhealthy: "Unhealthy",
  error: "Error",
};

const STATUS_STYLES: Record<HealthCheckStatus, string> = {
  healthy: "border-emerald-300 bg-emerald-50 text-emerald-600",
  unhealthy: "border-amber-300 bg-amber-50 text-amber-600",
  error: "border-red-300 bg-red-50 text-red-600",
};

function formatMillis(value: number | null): string {
  if (value === null) return "-";
  return `${Math.round(value)} ms`;
}

export function HealthCheckPanel({ active }: HealthCheckPanelProps) {
  const queryClient = useQueryClient();

  const summaryQuery = useQuery({
    queryKey: queryKeys.healthCheckSummary,
    queryFn: getHealthCheckSummary,
    enabled: active,
  });

  const latestQuery = useQuery({
    queryKey: queryKeys.healthCheckLatest,
    queryFn: getLatestHealthChecks,
    enabled: active,
  });

  const runMutation = useMutation({
    mutationFn: () => runHealthCheck(),
    onSuccess: () => {
      toast.success("Health check triggered");
      void queryClient.invalidateQueries({
        queryKey: queryKeys.healthCheckSummary,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.healthCheckLatest,
      });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to run health check";
      toast.error(message);
    },
  });

  const summary = summaryQuery.data;
  const checks = latestQuery.data?.checks ?? [];
  const isLoading = summaryQuery.isPending || latestQuery.isPending;
  const error = summaryQuery.error ?? latestQuery.error;
  const hasError = error instanceof Error;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Health check</h2>
          <p className="text-sm text-muted-foreground">
            Latest results and summary for model health checks.
          </p>
        </div>
        <Button
          onClick={() => runMutation.mutate()}
          disabled={runMutation.isPending}
          size="sm"
        >
          <RefreshCw
            className={`mr-1.5 h-3 w-3 ${
              runMutation.isPending ? "animate-spin" : ""
            }`}
          />
          Run health check
        </Button>
      </div>

      {hasError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error.message}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Healthy</p>
              <p className="text-lg font-semibold text-emerald-600">
                {summary?.healthy ?? 0}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Unhealthy</p>
              <p className="text-lg font-semibold text-amber-600">
                {summary?.unhealthy ?? 0}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Error</p>
              <p className="text-lg font-semibold text-red-600">
                {summary?.error ?? 0}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">{summary?.total ?? 0}</p>
            </div>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead>TTFT</TableHead>
                  <TableHead>Checked</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-sm">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : checks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-sm">
                      No health checks yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  checks.map((check) => (
                    <TableRow key={check.id}>
                      <TableCell className="font-mono text-xs">
                        {check.modelName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={STATUS_STYLES[check.status]}
                        >
                          {STATUS_LABELS[check.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatMillis(check.responseTimeMs)}
                      </TableCell>
                      <TableCell>{formatMillis(check.ttftMs)}</TableCell>
                      <TableCell>{formatTimestamp(check.checkedAt)}</TableCell>
                      <TableCell className="capitalize">
                        {check.source}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
