import { UserIcon } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
export function EntityRoutingCard({
  icon: Icon,
  title,
  description,
  totalCount,
  configuredCount,
  totalFallbacks,
  children,
}) {
  const hasFallbacks = totalFallbacks > 0;
  return _jsx("div", {
    className: "space-y-4",
    children: _jsxs(Card, {
      children: [
        _jsxs(CardHeader, {
          children: [
            _jsxs("div", {
              className: "flex items-center flex-1 justify-between gap-4",
              children: [
                _jsxs(CardTitle, {
                  className: "flex items-center gap-2",
                  children: [_jsx(Icon, { className: "size-5" }), title],
                }),
                _jsx("div", {
                  className: "flex items-center gap-4",
                  children: hasFallbacks
                    ? _jsxs("div", {
                        className:
                          "flex items-center text-muted-foreground gap-4",
                        children: [
                          _jsxs("div", {
                            className: "flex items-center gap-1.5",
                            children: [
                              _jsx(UserIcon, { className: "size-4" }),
                              _jsxs("span", {
                                className: "text-sm text-foreground",
                                children: [
                                  _jsx("span", {
                                    className: "font-medium",
                                    children: configuredCount,
                                  }),
                                  "/",
                                  totalCount,
                                  " configured",
                                ],
                              }),
                            ],
                          }),
                          _jsx("div", {
                            className: "flex items-center gap-1.5",
                            children: _jsxs("span", {
                              className: "text-sm text-foreground",
                              children: [
                                _jsx("span", {
                                  className: "font-medium text-foreground",
                                  children: totalFallbacks,
                                }),
                                " ",
                                "fallback",
                                totalFallbacks === 1 ? "" : "s",
                              ],
                            }),
                          }),
                        ],
                      })
                    : _jsxs(Badge, {
                        variant: "outline",
                        children: [
                          configuredCount,
                          "/",
                          totalCount,
                          " configured",
                        ],
                      }),
                }),
              ],
            }),
            description && _jsx(CardDescription, { children: description }),
          ],
        }),
        _jsx(CardContent, { className: "space-y-6", children: children }),
      ],
    }),
  });
}
