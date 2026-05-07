import { jsx as _jsx } from "react/jsx-runtime";
import { Badge } from "../ui/badge";

const TYPE_LABELS = {
  model_offline: "Model Offline",
  error_spike: "Error Spike",
  timeout_stuck: "Timeout/Stuck",
  silent_failure: "Silent Failure",
};
const TYPE_STYLES = {
  model_offline:
    "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-700",
  error_spike:
    "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-700",
  timeout_stuck:
    "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700",
  silent_failure:
    "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-700",
};
export function AlertTypeBadge({ type }) {
  const label = TYPE_LABELS[type] ?? type;
  const style = TYPE_STYLES[type] ?? "bg-muted text-muted-foreground";
  return _jsx(Badge, {
    variant: "secondary",
    className: style,
    children: label,
  });
}
