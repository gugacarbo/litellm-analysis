import { Inbox } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  className,
}) {
  return _jsxs("div", {
    className: `flex flex-col items-center justify-center text-center text-muted-foreground ${className ?? "py-12"}`,
    children: [
      _jsx(Icon, { className: "mb-3 h-10 w-10 stroke-1 opacity-40" }),
      title && _jsx("p", { className: "text-sm font-medium", children: title }),
      description &&
        _jsx("p", {
          className: "mt-1 max-w-xs text-xs",
          children: description,
        }),
    ],
  });
}
