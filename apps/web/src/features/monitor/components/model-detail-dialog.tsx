import type { ModelHealthEntry } from "monitor-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { APP_LOCALE, APP_TIMEZONE } from "@/shared/lib/locale";
import { cn } from "@/shared/lib/utils";
import { HealthStatusBadge } from "./health-status-badge";

function getSuccessRateColor(rate: number): string {
  if (rate >= 95) return "text-green-600";
  if (rate >= 90) return "text-amber-600";
  return "text-red-600";
}

function getErrorBarColor(rate: number): string {
  if (rate > 20) return "bg-red-500";
  if (rate > 10) return "bg-amber-500";
  return "bg-green-500";
}

export function ModelDetailDialog({
  model,
  open,
  onOpenChange,
}: {
  model: ModelHealthEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (model == null) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="truncate">{model.model}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <HealthStatusBadge status={model.status} />
            <span className="text-xs text-muted-foreground">
              {model.error_rate_1h.toFixed(1)}% errors
            </span>
          </div>

          <div className="h-2 rounded-full bg-muted">
            <div
              className={cn(
                "h-2 rounded-full transition-all",
                getErrorBarColor(model.error_rate_1h),
              )}
              style={{
                width: `${Math.min(model.error_rate_1h, 100)}%`,
              }}
            />
          </div>

          {model.stats != null ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-muted-foreground">
                  Success Rate
                </span>
                <p
                  className={cn(
                    "text-lg font-semibold",
                    model.stats.total_requests > 0
                      ? getSuccessRateColor(
                          (model.stats.success_count /
                            model.stats.total_requests) *
                            100,
                        )
                      : "text-muted-foreground",
                  )}
                >
                  {model.stats.total_requests > 0
                    ? `${((model.stats.success_count / model.stats.total_requests) * 100).toFixed(1)}%`
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">
                  Requests (1h)
                </span>
                <p className="text-lg font-semibold">
                  {model.stats.total_requests.toLocaleString(APP_LOCALE)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">
                  P95 Latency
                </span>
                <p className="text-lg font-semibold">
                  {model.stats.p95_latency_ms != null
                    ? `${model.stats.p95_latency_ms.toFixed(0)}ms`
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">
                  Avg Latency
                </span>
                <p className="text-lg font-semibold">
                  {model.stats.avg_latency_ms != null
                    ? `${model.stats.avg_latency_ms.toFixed(0)}ms`
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">
                  Errors
                </span>
                <p className="text-lg font-semibold">
                  {model.stats.error_count.toLocaleString(APP_LOCALE)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">
                  Last Activity
                </span>
                <p className="truncate text-sm font-medium">
                  {model.stats.last_success_at
                    ? new Date(model.stats.last_success_at).toLocaleString(
                        APP_LOCALE,
                        {
                          timeZone: APP_TIMEZONE,
                        },
                      )
                    : "—"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Detailed stats available once WebSocket connects.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
