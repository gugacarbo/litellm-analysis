import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ChartTooltipContent({
  active,
  payload,
  label,
  formatter = (v) => String(v),
  labelFormatter = (l) => l,
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  return _jsxs("div", {
    className: "rounded-lg border bg-background p-2 shadow-sm",
    children: [
      _jsx("p", {
        className: "text-sm font-medium text-foreground",
        children: labelFormatter(label),
      }),
      _jsx("div", {
        className: "mt-1 space-y-0.5",
        children: payload.map((entry, index) =>
          _jsxs(
            "div",
            {
              className: "flex items-center gap-2 text-xs",
              children: [
                _jsx("span", {
                  className: "h-2 w-2 rounded-full",
                  style: { backgroundColor: entry.color },
                }),
                _jsxs("span", {
                  className: "text-muted-foreground",
                  children: [entry.name, ":"],
                }),
                _jsx("span", {
                  className: "font-medium text-foreground",
                  children: formatter(entry.value),
                }),
              ],
            },
            index,
          ),
        ),
      }),
    ],
  });
}
