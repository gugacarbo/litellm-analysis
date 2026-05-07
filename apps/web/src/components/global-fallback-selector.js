"use client";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Globe } from "lucide-react";
import { useState } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getAllModels } from "../lib/api-client/models";
import { queryKeys } from "../lib/query-keys";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
export function GlobalFallbackSelector({ value, onValueChange }) {
  const [open, setOpen] = useState(false);
  const modelsQuery = useQuery({
    queryKey: queryKeys.models,
    queryFn: getAllModels,
  });
  const availableModels = modelsQuery.data ?? [];
  const handleSelect = (model) => {
    onValueChange(model);
    setOpen(false);
  };
  return _jsxs(Dialog, {
    open: open,
    onOpenChange: setOpen,
    children: [
      _jsx(DialogTrigger, {
        asChild: true,
        children: _jsxs(Button, {
          variant: "outline",
          size: "sm",
          className: "gap-2 h-8 text-xs",
          children: [
            _jsx(Globe, { className: "h-3 w-3 text-muted-foreground" }),
            _jsx("span", {
              className: "text-muted-foreground",
              children: "Fallback:",
            }),
            _jsx("span", {
              className: "font-medium",
              children: value || "None",
            }),
            _jsx(ChevronDown, {
              className: "h-3 w-3 text-muted-foreground ml-1",
            }),
          ],
        }),
      }),
      _jsxs(DialogContent, {
        className: "sm:max-w-[425px]",
        children: [
          _jsx(DialogHeader, {
            children: _jsxs(DialogTitle, {
              className: "flex items-center gap-2",
              children: [
                _jsx(Globe, { className: "h-4 w-4" }),
                "Global Fallback Model",
              ],
            }),
          }),
          _jsx("p", {
            className: "text-sm text-muted-foreground",
            children: "Used when all agent-specific fallbacks are exhausted.",
          }),
          _jsx("div", {
            className: "max-h-[300px] overflow-y-auto mt-2",
            children: _jsx("div", {
              className: "space-y-1",
              children: availableModels.map((model) =>
                _jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => handleSelect(model.modelName),
                    className: `w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      value === model.modelName
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`,
                    children: model.modelName,
                  },
                  model.modelName,
                ),
              ),
            }),
          }),
        ],
      }),
    ],
  });
}
