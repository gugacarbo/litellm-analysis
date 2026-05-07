import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
export function CategoryConfigEditorAdvancedSection({
  config,
  onUpdateConfig,
  onUpdateThinkingConfig,
}) {
  return _jsxs("section", {
    className: "space-y-4",
    children: [
      _jsxs("div", {
        className: "space-y-1",
        children: [
          _jsx("h3", {
            className: "font-semibold",
            children: "Advanced Settings",
          }),
          _jsx("p", {
            className: "text-xs text-muted-foreground",
            children:
              "Reasoning depth, verbosity and thinking budget controls.",
          }),
        ],
      }),
      _jsxs("div", {
        className: "grid grid-cols-1 gap-4 md:grid-cols-2",
        children: [
          _jsxs("div", {
            className: "space-y-2",
            children: [
              _jsx(Label, {
                htmlFor: "reasoningEffort",
                children: "Reasoning Effort",
              }),
              _jsxs(Select, {
                value: config.reasoningEffort || "",
                onValueChange: (value) =>
                  onUpdateConfig("reasoningEffort", value),
                children: [
                  _jsx(SelectTrigger, {
                    children: _jsx(SelectValue, {
                      placeholder: "Select effort",
                    }),
                  }),
                  _jsxs(SelectContent, {
                    children: [
                      _jsx(SelectItem, { value: "low", children: "Low" }),
                      _jsx(SelectItem, { value: "medium", children: "Medium" }),
                      _jsx(SelectItem, { value: "high", children: "High" }),
                      _jsx(SelectItem, {
                        value: "xhigh",
                        children: "Extra High",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          _jsxs("div", {
            className: "space-y-2",
            children: [
              _jsx(Label, {
                htmlFor: "textVerbosity",
                children: "Text Verbosity",
              }),
              _jsxs(Select, {
                value: config.textVerbosity || "",
                onValueChange: (value) =>
                  onUpdateConfig("textVerbosity", value),
                children: [
                  _jsx(SelectTrigger, {
                    children: _jsx(SelectValue, {
                      placeholder: "Select verbosity",
                    }),
                  }),
                  _jsxs(SelectContent, {
                    children: [
                      _jsx(SelectItem, { value: "low", children: "Low" }),
                      _jsx(SelectItem, { value: "medium", children: "Medium" }),
                      _jsx(SelectItem, { value: "high", children: "High" }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          _jsxs("div", {
            className: "space-y-2",
            children: [
              _jsx(Label, { htmlFor: "thinking-type", children: "Thinking" }),
              _jsxs(Select, {
                value: config.thinking?.type || "enabled",
                onValueChange: (value) => onUpdateThinkingConfig("type", value),
                children: [
                  _jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }),
                  _jsxs(SelectContent, {
                    children: [
                      _jsx(SelectItem, {
                        value: "enabled",
                        children: "Enabled",
                      }),
                      _jsx(SelectItem, {
                        value: "disabled",
                        children: "Disabled",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          _jsxs("div", {
            className: "space-y-2",
            children: [
              _jsx(Label, {
                htmlFor: "budgetTokens",
                children: "Budget Tokens",
              }),
              _jsx(Input, {
                id: "budgetTokens",
                type: "number",
                min: "0",
                value: config.thinking?.budgetTokens ?? "",
                onChange: (e) =>
                  onUpdateThinkingConfig(
                    "budgetTokens",
                    e.target.value ? parseInt(e.target.value, 10) : undefined,
                  ),
                placeholder: "Token budget",
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
