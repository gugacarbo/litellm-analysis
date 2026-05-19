import {
  ANOMALY_TYPE_COLORS,
  ANOMALY_TYPE_LABELS,
} from "@/features/monitor/monitor-utils";
import { Badge } from "@/shared/components/ui/badge";

type AlertTypeBadgeProps = {
  type: string;
};

export function AlertTypeBadge({ type }: AlertTypeBadgeProps) {
  const label = ANOMALY_TYPE_LABELS[type] ?? type;
  const style = ANOMALY_TYPE_COLORS[type] ?? "bg-muted text-muted-foreground";
  return (
    <Badge variant="secondary" className={style}>
      {label}
    </Badge>
  );
}
