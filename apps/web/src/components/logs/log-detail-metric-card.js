import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function MetricCard({ icon: Icon, label, value, accent }) {
  return _jsxs("div", {
    className: "rounded-lg border bg-card p-3 space-y-2",
    children: [
      _jsxs("div", {
        className: "flex items-center gap-2",
        children: [
          _jsx(Icon, { className: `h-4 w-4 ${accent}` }),
          _jsx("span", {
            className: "text-xs text-muted-foreground uppercase tracking-wide",
            children: label,
          }),
        ],
      }),
      _jsx("div", { className: "text-lg font-semibold", children: value }),
    ],
  });
}
