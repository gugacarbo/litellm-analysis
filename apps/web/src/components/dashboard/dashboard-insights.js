import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

function getToneDot(tone) {
  if (tone === "positive") return "bg-emerald-500";
  if (tone === "warning") return "bg-amber-500";
  return "bg-muted-foreground";
}
export function DashboardInsights({ loading, insights }) {
  const content = loading
    ? _jsx("div", {
        className: "flex flex-wrap gap-2",
        children: Array.from({ length: 6 }).map((_, index) =>
          _jsxs(
            "div",
            {
              className:
                "flex items-center gap-2 rounded-full bg-muted px-3 py-1.5",
              children: [
                _jsx(Skeleton, { className: "h-2 w-2 rounded-full shrink-0" }),
                _jsx(Skeleton, { className: "h-4 w-20" }),
              ],
            },
            `skeleton-${index}`,
          ),
        ),
      })
    : insights.length === 0
      ? null
      : _jsx("div", {
          className: "flex flex-wrap gap-2",
          children: insights.map((item) =>
            _jsxs(
              "div",
              {
                className:
                  "group relative flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1.5 text-sm transition-colors hover:bg-muted/60",
                children: [
                  _jsx("span", {
                    className: cn(
                      "h-2 w-2 rounded-full shrink-0",
                      getToneDot(item.tone),
                    ),
                  }),
                  _jsx("span", {
                    className: "font-medium",
                    children: item.value,
                  }),
                  _jsx("span", {
                    className: "text-muted-foreground hidden sm:inline",
                    children: item.title,
                  }),
                  _jsxs("div", {
                    className:
                      "absolute bottom-full left-1/2 z-10 mb-2 hidden w-48 -translate-x-1/2 rounded-lg border bg-popover p-2 text-xs text-popover-foreground shadow-md group-hover:block",
                    children: [
                      _jsx("p", {
                        className: "font-medium",
                        children: item.title,
                      }),
                      _jsx("p", {
                        className: "text-muted-foreground",
                        children: item.detail,
                      }),
                    ],
                  }),
                ],
              },
              item.title,
            ),
          ),
        });
  if (content === null) return null;
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, {
        children: _jsx(CardTitle, { children: "Analysis Highlights" }),
      }),
      _jsx(CardContent, { children: content }),
    ],
  });
}
