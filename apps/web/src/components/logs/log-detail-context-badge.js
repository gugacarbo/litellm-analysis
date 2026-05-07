import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

const variantStyles = {
  default: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-transparent",
  },
  success: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/20",
  },
  warning: {
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/20",
  },
  info: {
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-500/20",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-500/20",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-700 dark:text-cyan-400",
    border: "border-cyan-500/20",
  },
};
export function ContextBadge({
  label,
  icon: Icon,
  variant = "default",
  className,
}) {
  const styles = variantStyles[variant];
  return _jsxs("span", {
    className: `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${styles.bg} ${styles.text} ${styles.border} ${className ?? ""}`,
    children: [Icon && _jsx(Icon, { className: "h-3 w-3 mr-1.5" }), label],
  });
}
