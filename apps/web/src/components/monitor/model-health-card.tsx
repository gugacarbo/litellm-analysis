import { cn } from "../../lib/utils";
import type { ModelHealthEntry } from "../../pages/monitor/monitor-types";
import { Card } from "../ui/card";
import { HealthStatusBadge } from "./health-status-badge";

type ModelHealthCardProps = {
  model: ModelHealthEntry;
  className?: string;
};

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

export function ModelHealthCard({ model, className }: ModelHealthCardProps) {
  const borderClass =
    model.status === "offline"
      ? "border-red-500/50"
      : model.status === "degraded"
        ? "border-amber-500/50"
        : "";

  return (
    <Card className={cn("min-w-[220px] p-3", className, borderClass)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium leading-none">
          {model.model}
        </span>
        <HealthStatusBadge status={model.status} />
      </div>

      {model.stats == null ? (
        <p className="py-3 text-center text-xs text-muted-foreground">
          No recent data
        </p>
      ) : (
        <>
          <div className="mb-2 grid grid-cols-2 gap-x-3 gap-y-1">
            <div>
              <span className="text-[10px] text-muted-foreground">
                Success
              </span>
              <p
                className={cn(
                  "text-sm font-medium",
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
                  ? `${(
                      (model.stats.success_count /
                        model.stats.total_requests) *
                      100
                    ).toFixed(0)}%`
                  : "—"}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground">
                Req (1h)
              </span>
              <p className="text-sm font-medium">
                {model.stats.total_requests.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground">P95</span>
              <p className="text-sm font-medium">
                {model.stats.p95_latency_ms != null
                  ? `${model.stats.p95_latency_ms.toFixed(0)}ms`
                  : "—"}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground">Avg</span>
              <p className="text-sm font-medium">
                {model.stats.avg_latency_ms != null
                  ? `${model.stats.avg_latency_ms.toFixed(0)}ms`
                  : "—"}
              </p>
            </div>
          </div>
          <div>
            <div className="mb-0.5 flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Errors</span>
              <span
                className={cn(
                  getSuccessRateColor(100 - model.error_rate_1h),
                )}
              >
                {model.error_rate_1h.toFixed(0)}%
              </span>
            </div>
            <div className="h-1 rounded-full bg-muted">
              <div
                className={cn(
                  "h-1 rounded-full transition-all",
                  getErrorBarColor(model.error_rate_1h),
                )}
                style={{
                  width: `${Math.min(model.error_rate_1h, 100)}%`,
                }}
              />
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
