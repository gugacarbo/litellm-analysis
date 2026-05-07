import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

const TONE_CLASSES = {
  positive: "text-emerald-700 dark:text-emerald-300",
  warning: "text-amber-700 dark:text-amber-300",
  negative: "text-red-700 dark:text-red-300",
  neutral: "text-foreground",
};
export function Insights({ insights, title, description, loading = false }) {
  if (!loading && insights.length === 0) return null;
  return _jsxs("div", {
    className: "space-y-3",
    children: [
      title &&
        _jsxs("div", {
          className: "space-y-1",
          children: [
            _jsx("h2", { className: "text-xl font-semibold", children: title }),
            description &&
              _jsx("p", {
                className: "text-sm text-muted-foreground",
                children: description,
              }),
          ],
        }),
      _jsx("div", {
        className: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
        children: loading
          ? Array.from({ length: 6 }).map((_, index) =>
              _jsxs(
                Card,
                {
                  children: [
                    _jsx(CardHeader, {
                      className: "pb-2",
                      children: _jsx(Skeleton, { className: "h-4 w-24" }),
                    }),
                    _jsxs(CardContent, {
                      className: "space-y-1",
                      children: [
                        _jsx(Skeleton, { className: "h-6 w-32" }),
                        _jsx(Skeleton, { className: "h-3 w-40" }),
                      ],
                    }),
                  ],
                },
                `skeleton-${index}`,
              ),
            )
          : insights.map((insight, index) => {
              const Icon = insight.icon;
              return _jsxs(
                Card,
                {
                  children: [
                    _jsx(CardHeader, {
                      className: "pb-2",
                      children: _jsxs(CardTitle, {
                        className:
                          "text-sm font-medium text-muted-foreground flex items-center gap-1.5",
                        children: [
                          Icon && _jsx(Icon, { className: "h-3.5 w-3.5" }),
                          insight.detail,
                        ],
                      }),
                    }),
                    _jsx(CardContent, {
                      className: "space-y-1",
                      children: _jsx("p", {
                        className: `text-2xl font-bold truncate ${TONE_CLASSES[insight.type]}`,
                        children: insight.value,
                      }),
                    }),
                  ],
                },
                `insight-${index}`,
              );
            }),
      }),
    ],
  });
}
