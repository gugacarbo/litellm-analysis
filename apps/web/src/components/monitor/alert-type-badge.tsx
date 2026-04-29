import { Badge } from "../ui/badge";

type AlertTypeBadgeProps = {
  type: string;
};

const TYPE_LABELS: Record<string, string> = {
  model_offline: "Model Offline",
  error_spike: "Error Spike",
  timeout_stuck: "Timeout/Stuck",
  silent_failure: "Silent Failure",
};

const TYPE_STYLES: Record<string, string> = {
  model_offline: "bg-red-500/15 text-red-700 border-red-500/30",
  error_spike: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  timeout_stuck: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
  silent_failure: "bg-purple-500/15 text-purple-700 border-purple-500/30",
};

export function AlertTypeBadge({ type }: AlertTypeBadgeProps) {
  const label = TYPE_LABELS[type] ?? type;
  const style = TYPE_STYLES[type] ?? "bg-muted text-muted-foreground";
  return (
    <Badge variant="secondary" className={style}>
      {label}
    </Badge>
  );
}
