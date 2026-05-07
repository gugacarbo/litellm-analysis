import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "../../lib/utils";
export function LogDetailRow({ icon: Icon, label, value, mono = false }) {
  return _jsxs("div", {
    className: "flex items-start justify-between gap-4 px-3 py-2.5",
    children: [
      _jsxs("div", {
        className: "flex items-center gap-2 text-muted-foreground",
        children: [
          _jsx(Icon, { className: "mt-0.5 h-4 w-4 shrink-0" }),
          _jsx("div", {
            className: "text-xs uppercase tracking-wide",
            children: label,
          }),
        ],
      }),
      _jsx("div", {
        className: cn(
          "min-w-0 max-w-[62%] text-right text-sm font-medium break-words",
          mono ? "font-mono text-xs break-all" : "",
        ),
        children: value,
      }),
    ],
  });
}
