import { Check, Layers, Palette } from "lucide-react";
import { useState } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
export function EntityFocusCard({
  entityKey,
  name,
  description,
  icon,
  configInfo,
  models,
  onOpenConfig,
  onQuickModelChange,
}) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const hasPrimaryModel = Boolean(
    configInfo && configInfo.model !== "Unassigned",
  );
  return _jsxs("div", {
    className: cn(
      "group relative flex flex-col rounded-xl border overflow-hidden p-3 transition-all duration-200",
      hasPrimaryModel
        ? "bg-card hover:border-primary/30"
        : "border-dashed border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50",
    ),
    children: [
      configInfo?.color &&
        _jsx("div", {
          className: "absolute inset-x-0 top-0 h-1 rounded-t-xl",
          style: { backgroundColor: configInfo.color },
        }),
      _jsxs("div", {
        className: "flex items-start justify-between gap-2",
        children: [
          _jsxs("div", {
            className: "flex min-w-0 flex-1 items-center gap-2",
            children: [
              icon && _jsx("span", { className: "text-xl", children: icon }),
              _jsxs("div", {
                className: "min-w-0 flex-1",
                children: [
                  _jsx("p", {
                    className: "truncate font-medium",
                    children: name,
                  }),
                  _jsx("p", {
                    className: "truncate text-xs text-muted-foreground",
                    children: configInfo?.description || description,
                  }),
                ],
              }),
            ],
          }),
          _jsx(Button, {
            variant: "ghost",
            size: "icon-sm",
            title: "Edit configuration",
            className:
              "h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100",
            onClick: () => onOpenConfig(entityKey),
            children: _jsx(Palette, { className: "h-3.5 w-3.5" }),
          }),
        ],
      }),
      _jsxs("div", {
        className: "mt-3 flex-1",
        children: [
          _jsx("label", {
            className:
              "mb-1.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground",
            children: "Model",
          }),
          _jsxs(Select, {
            value: hasPrimaryModel ? configInfo?.model : "",
            onValueChange: (value) => {
              onQuickModelChange(entityKey, value);
              setOpenDropdown(null);
            },
            open: openDropdown === entityKey,
            onOpenChange: (open) => setOpenDropdown(open ? entityKey : null),
            children: [
              _jsx(SelectTrigger, {
                className: "h-8 w-full justify-between font-mono text-xs",
                children: _jsx(SelectValue, {
                  placeholder: "Select model...",
                  children: hasPrimaryModel
                    ? configInfo?.model
                    : "Select model...",
                }),
              }),
              _jsx(SelectContent, {
                children: models.map((model) =>
                  _jsx(
                    SelectItem,
                    {
                      value: model,
                      className: "font-mono text-xs",
                      children: _jsxs("div", {
                        className: "flex items-center gap-2",
                        children: [
                          configInfo?.model === model &&
                            _jsx(Check, {
                              className: "h-3 w-3 text-emerald-500",
                            }),
                          _jsx("span", { children: model }),
                        ],
                      }),
                    },
                    model,
                  ),
                ),
              }),
            ],
          }),
        ],
      }),
      configInfo?.fallbackCount
        ? _jsxs("div", {
            className:
              "mt-2 flex items-center gap-1 text-xs text-muted-foreground",
            children: [
              _jsx(Layers, { className: "h-3 w-3" }),
              _jsxs("span", {
                children: [
                  "+",
                  configInfo.fallbackCount,
                  " fallback",
                  configInfo.fallbackCount === 1 ? "" : "s",
                ],
              }),
            ],
          })
        : null,
    ],
  });
}
