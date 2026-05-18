import { Badge } from "../ui/badge";

type AlertSeverityBadgeProps = {
  severity: string;
};

const SEVERITY_STYLES: Record<string, string> = {
  critical:
    "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-700",
  warning:
    "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700",
  info: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700",
};

export function AlertSeverityBadge({ severity }: AlertSeverityBadgeProps) {
  const style = SEVERITY_STYLES[severity] ?? "bg-muted text-muted-foreground";
  return (
    <Badge variant="secondary" className={style}>
      {severity}
    </Badge>
  );
}
