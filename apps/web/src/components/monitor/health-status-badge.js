import { jsx as _jsx } from "react/jsx-runtime";
import { Badge } from "../ui/badge";

const STATUS_LABELS = {
  healthy: "Healthy",
  degraded: "Degraded",
  offline: "Offline",
  unknown: "Unknown",
};
const STATUS_STYLES = {
  healthy: "border-emerald-300 bg-emerald-50 text-emerald-600",
  degraded: "border-amber-300 bg-amber-50 text-amber-600",
  offline: "border-red-300 bg-red-50 text-red-600",
  unknown: "border-gray-300 bg-gray-50 text-gray-600",
};
export function HealthStatusBadge({ status }) {
  return _jsx(Badge, {
    variant: "outline",
    className: STATUS_STYLES[status],
    children: STATUS_LABELS[status],
  });
}
