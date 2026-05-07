import { useCallback } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { normalizeHexColor } from "../../lib/utils";
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
export function AgentConfigEditorBasicSection({ config, onUpdateConfig }) {
  const handleColorChange = useCallback(
    (value) => {
      const normalized = normalizeHexColor(value);
      if (normalized) {
        onUpdateConfig("color", normalized);
      }
    },
    [onUpdateConfig],
  );
  return _jsxs("section", {
    className: "space-y-4",
    children: [
      _jsxs("div", {
        className: "space-y-1",
        children: [
          _jsx("h3", {
            className: "font-semibold",
            children: "Basic Information",
          }),
          _jsx("p", {
            className: "text-xs text-muted-foreground",
            children: "Identity, grouping and availability controls.",
          }),
        ],
      }),
      _jsxs("div", {
        className: "grid grid-cols-1 gap-4 md:grid-cols-2",
        children: [
          _jsxs("div", {
            className: "space-y-2",
            children: [
              _jsx(Label, { htmlFor: "category", children: "Category" }),
              _jsx(Input, {
                id: "category",
                value: config.category || "",
                onChange: (e) => onUpdateConfig("category", e.target.value),
                placeholder: "Enter category",
              }),
            ],
          }),
          _jsxs("div", {
            className: "space-y-2",
            children: [
              _jsx(Label, { htmlFor: "mode", children: "Mode" }),
              _jsxs(Select, {
                value: config.mode || "subagent",
                onValueChange: (value) => onUpdateConfig("mode", value),
                children: [
                  _jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }),
                  _jsxs(SelectContent, {
                    children: [
                      _jsx(SelectItem, {
                        value: "subagent",
                        children: "Subagent",
                      }),
                      _jsx(SelectItem, {
                        value: "primary",
                        children: "Primary",
                      }),
                      _jsx(SelectItem, { value: "all", children: "All" }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          _jsxs("div", {
            className: "space-y-2",
            children: [
              _jsx(Label, { htmlFor: "color", children: "Color" }),
              _jsxs("div", {
                className: "flex items-center gap-2",
                children: [
                  _jsx("input", {
                    type: "color",
                    value: config.color || "#000000",
                    onChange: (e) => handleColorChange(e.target.value),
                    className:
                      "h-10 w-10 cursor-pointer rounded-md border border-border",
                  }),
                  _jsx(Input, {
                    id: "color",
                    value: config.color || "",
                    onChange: (e) => handleColorChange(e.target.value),
                    placeholder: "#RRGGBB",
                    className: "flex-1",
                  }),
                ],
              }),
            ],
          }),
          _jsxs("div", {
            className: "space-y-2",
            children: [
              _jsx(Label, { children: "Disable" }),
              _jsxs("div", {
                className: "flex items-center gap-2 pt-2",
                children: [
                  _jsx("input", {
                    type: "checkbox",
                    checked: !!config.disable,
                    onChange: (e) =>
                      onUpdateConfig("disable", e.target.checked),
                    className: "h-4 w-4",
                  }),
                  _jsx("span", {
                    className: "text-sm text-muted-foreground",
                    children: "Disable this agent",
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
          _jsx(Label, { htmlFor: "description", children: "Description" }),
          _jsx(Textarea, {
            id: "description",
            value: config.description || "",
            onChange: (e) => onUpdateConfig("description", e.target.value),
            placeholder: "Enter description",
            rows: 3,
          }),
        ],
      }),
    ],
  });
}
