import { Badge } from "../ui/badge";

type AlertSeverityBadgeProps = {
  severity: string;
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/15 text-red-700 border-red-500/30",
  warning: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
  info: "bg-blue-500/15 text-blue-700 border-blue-500/30",
};

export function AlertSeverityBadge({ severity }: AlertSeverityBadgeProps) {
  const style = SEVERITY_STYLES[severity] ?? "bg-muted text-muted-foreground";
  return (
    <Badge variant="secondary" className={style}>
      {severity}
    </Badge>
  );
}
