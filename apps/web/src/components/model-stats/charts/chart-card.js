import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Skeleton } from "../../ui/skeleton";
export function ChartCard({ title, loading, hasData, children }) {
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, { children: _jsx(CardTitle, { children: title }) }),
      _jsx(CardContent, {
        children: loading
          ? _jsx(Skeleton, { className: "h-64 w-full" })
          : hasData
            ? children
            : null,
      }),
    ],
  });
}
