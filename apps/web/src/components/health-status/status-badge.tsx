import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import {
  STATUS_COLORS,
  STATUS_LABELS,
} from "../../pages/health-status/health-status-utils";
import { Badge } from "../ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    ...STATUS_COLORS,
    unknown: "#9ca3af",
    checking: "#2563eb",
  };
  const labelMap: Record<string, string> = {
    ...STATUS_LABELS,
    unknown: "Not tested",
    checking: "Checking",
  };
  const color = colorMap[status] ?? "#9ca3af";

  return (
    <Badge
      variant="outline"
      className="gap-1 shrink-0"
      style={{ borderColor: color, color }}
    >
      {status === "healthy" ? (
        <CheckCircle className="size-3" />
      ) : status === "checking" ? (
        <Loader2 className="size-3 animate-spin" />
      ) : status === "unknown" ? (
        <Clock className="size-3" />
      ) : status === "error" ? (
        <XCircle className="size-3" />
      ) : (
        <AlertTriangle className="size-3" />
      )}
      {labelMap[status] ?? status}
    </Badge>
  );
}
