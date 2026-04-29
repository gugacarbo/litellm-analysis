import { useCallback, useEffect, useState } from "react";
import { useMonitorWebSocket } from "../../hooks/use-monitor-websocket";
import {
  acknowledgeAlertById,
  getMonitorAlerts,
} from "../../lib/api-client/monitor";
import { formatDateTime } from "../../lib/spend-log-utils";
import type { MonitorAlert } from "../../pages/monitor/monitor-types";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { AlertFilters, type AlertFiltersState } from "./alert-filters";
import { AlertSeverityBadge } from "./alert-severity-badge";
import { AlertTypeBadge } from "./alert-type-badge";

const PAGE_SIZE = 20;

export function AlertHistoryTable() {
  const { lastAlerts } = useMonitorWebSocket();
  const [alerts, setAlerts] = useState<MonitorAlert[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AlertFiltersState>({
    anomalyType: "",
    severity: "",
    model: "",
  });

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMonitorAlerts({
        anomalyType: filters.anomalyType || undefined,
        severity: filters.severity || undefined,
        model: filters.model || undefined,
        limit: PAGE_SIZE,
        offset,
      });
      setAlerts(res.alerts);
      setTotal(res.total);
    } catch {
      // Silent fail — table stays empty or shows previous data
    } finally {
      setLoading(false);
    }
  }, [filters, offset]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Optimistic update from WebSocket — prepend new alerts on first page
  useEffect(() => {
    if (lastAlerts.length === 0 || offset !== 0) return;

    setAlerts((prev) => {
      const existingIds = new Set(prev.map((a) => a.id));
      const newOnes = lastAlerts.filter((a) => !existingIds.has(a.id));
      if (newOnes.length === 0) return prev;
      return [...newOnes, ...prev].slice(0, PAGE_SIZE);
    });
  }, [lastAlerts, offset]);

  const handleAcknowledge = async (id: number) => {
    try {
      await acknowledgeAlertById(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch {
      // Silent fail — alert stays visible
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const handleApplyFilters = () => {
    setOffset(0);
    fetchAlerts();
  };

  const handleClearFilters = () => {
    setFilters({ anomalyType: "", severity: "", model: "" });
    setOffset(0);
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Alert History</CardTitle>
            <CardDescription>
              {loading
                ? "Loading alerts..."
                : total > 0
                  ? `${total.toLocaleString("en-US")} matching alerts`
                  : "No alerts detected — the system is running normally"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <AlertFilters
          values={filters}
          onValuesChange={setFilters}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
        />

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && alerts.length === 0 ? (
                Array.from({ length: 5 }).map((_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {Array.from({ length: 6 }).map((_, colIndex) => (
                      <TableCell key={`${rowIndex}-${colIndex}`}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : alerts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No alerts found
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                      {formatDateTime(
                        new Date(alert.detectedAt * 1000).toISOString(),
                      )}
                    </TableCell>
                    <TableCell>
                      <AlertTypeBadge type={alert.anomalyType} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {alert.model ?? "-"}
                    </TableCell>
                    <TableCell>
                      <AlertSeverityBadge severity={alert.severity} />
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {alert.message}
                    </TableCell>
                    <TableCell className="text-right">
                      {alert.acknowledgedAt ? (
                        <span className="text-xs text-muted-foreground">
                          Acknowledged
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAcknowledge(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({total} total)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => setOffset(offset + PAGE_SIZE)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
