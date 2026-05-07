import { Plus, Trash2 } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
export function CategoryConfigEditorExecutionSection({
  config,
  newToolKey,
  newToolValue,
  onUpdateConfig,
  onNewToolKeyChange,
  onNewToolValueChange,
  onAddTool,
  onRemoveTool,
  onUpdateToolValue,
}) {
  return _jsxs("section", {
    className: "space-y-4",
    children: [
      _jsxs("div", {
        className: "space-y-1",
        children: [
          _jsx("h3", {
            className: "font-semibold",
            children: "Execution Settings",
          }),
          _jsx("p", {
            className: "text-xs text-muted-foreground",
            children: "Prompt append and tools available for this category.",
          }),
        ],
      }),
      _jsxs("div", {
        className: "space-y-2",
        children: [
          _jsx(Label, { htmlFor: "prompt_append", children: "Prompt Append" }),
          _jsx(Textarea, {
            id: "prompt_append",
            value: config.prompt_append || "",
            onChange: (e) => onUpdateConfig("prompt_append", e.target.value),
            placeholder: "Enter prompt append",
            rows: 6,
          }),
        ],
      }),
      _jsxs("div", {
        className: "space-y-2",
        children: [
          _jsxs("div", {
            className: "flex flex-wrap items-center justify-between gap-2",
            children: [
              _jsx(Label, { children: "Tools" }),
              _jsxs("div", {
                className: "flex flex-wrap items-center gap-2",
                children: [
                  _jsx(Input, {
                    value: newToolKey,
                    onChange: (e) => onNewToolKeyChange(e.target.value),
                    placeholder: "Key",
                    className: "h-8 w-32",
                  }),
                  _jsxs(Select, {
                    value: newToolValue.toString(),
                    onValueChange: (value) =>
                      onNewToolValueChange(value === "true"),
                    children: [
                      _jsx(SelectTrigger, {
                        className: "h-8 w-24",
                        children: _jsx(SelectValue, {}),
                      }),
                      _jsxs(SelectContent, {
                        children: [
                          _jsx(SelectItem, {
                            value: "true",
                            children: "Enabled",
                          }),
                          _jsx(SelectItem, {
                            value: "false",
                            children: "Disabled",
                          }),
                        ],
                      }),
                    ],
                  }),
                  _jsx(Button, {
                    type: "button",
                    variant: "outline",
                    size: "sm",
                    onClick: onAddTool,
                    children: _jsx(Plus, { className: "h-3 w-3" }),
                  }),
                ],
              }),
            ],
          }),
          config.tools && Object.keys(config.tools).length > 0
            ? _jsx("div", {
                className: "space-y-2",
                children: Object.entries(config.tools).map(([key, value]) =>
                  _jsxs(
                    "div",
                    {
                      className: "flex items-center gap-2",
                      children: [
                        _jsx(Badge, {
                          variant: "secondary",
                          className: "px-2 py-1",
                          children: key,
                        }),
                        _jsxs(Select, {
                          value: value.toString(),
                          onValueChange: (v) =>
                            onUpdateToolValue(key, v === "true"),
                          children: [
                            _jsx(SelectTrigger, {
                              className: "h-8 w-24",
                              children: _jsx(SelectValue, {}),
                            }),
                            _jsxs(SelectContent, {
                              children: [
                                _jsx(SelectItem, {
                                  value: "true",
                                  children: "Enabled",
                                }),
                                _jsx(SelectItem, {
                                  value: "false",
                                  children: "Disabled",
                                }),
                              ],
                            }),
                          ],
                        }),
                        _jsx(Button, {
                          type: "button",
                          variant: "outline",
                          size: "sm",
                          onClick: () => onRemoveTool(key),
                          children: _jsx(Trash2, { className: "h-3 w-3" }),
                        }),
                      ],
                    },
                    key,
                  ),
                ),
              })
            : _jsx("p", {
                className: "text-sm text-muted-foreground",
                children: "No tools configured",
              }),
        ],
      }),
    ],
  });
}
