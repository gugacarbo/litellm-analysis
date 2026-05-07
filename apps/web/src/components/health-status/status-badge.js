import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  STATUS_COLORS,
  STATUS_LABELS,
} from "../../pages/health-status/health-status-utils";
import { Badge } from "../ui/badge";
export function StatusBadge({ status }) {
  const colorMap = {
    ...STATUS_COLORS,
    unknown: "#9ca3af",
    checking: "#2563eb",
  };
  const labelMap = {
    ...STATUS_LABELS,
    unknown: "Not tested",
    checking: "Checking",
  };
  const color = colorMap[status] ?? "#9ca3af";
  return _jsxs(Badge, {
    variant: "outline",
    className: "gap-1 shrink-0",
    style: { borderColor: color, color },
    children: [
      status === "healthy"
        ? _jsx(CheckCircle, { className: "size-3" })
        : status === "checking"
          ? _jsx(Loader2, { className: "size-3 animate-spin" })
          : status === "unknown"
            ? _jsx(Clock, { className: "size-3" })
            : status === "error"
              ? _jsx(XCircle, { className: "size-3" })
              : _jsx(AlertTriangle, { className: "size-3" }),
      labelMap[status] ?? status,
    ],
  });
}
