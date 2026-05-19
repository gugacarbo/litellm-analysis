import type { ModelHealthStatus } from "monitor-types";
import { Badge } from "@/shared/components/ui/badge";

type HealthStatusBadgeProps = {
  status: ModelHealthStatus;
};

const STATUS_LABELS: Record<ModelHealthStatus, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  offline: "Offline",
  unknown: "Unknown",
};

const STATUS_STYLES: Record<ModelHealthStatus, string> = {
  healthy: "border-emerald-300 bg-emerald-50 text-emerald-600",
  degraded: "border-amber-300 bg-amber-50 text-amber-600",
  offline: "border-red-300 bg-red-50 text-red-600",
  unknown: "border-gray-300 bg-gray-50 text-gray-600",
};

export function HealthStatusBadge({ status }: HealthStatusBadgeProps) {
  return (
    <Badge variant="outline" className={STATUS_STYLES[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
