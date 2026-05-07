import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ModelFallbackSelector } from "../model-fallback-selector";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
export function CategoryConfigEditorBasicSection({ config, onUpdateConfig }) {
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
            children:
              "Visibility flags and contextual description for this category.",
          }),
        ],
      }),
      _jsx("div", {
        className: "space-y-2",
        children: _jsxs("div", {
          className: "flex items-center gap-2 pt-2",
          children: [
            _jsx("input", {
              type: "checkbox",
              checked: !!config.is_unstable_agent,
              onChange: (e) =>
                onUpdateConfig("is_unstable_agent", e.target.checked),
              className: "h-4 w-4",
            }),
            _jsx(Label, { children: "Is Unstable Agent" }),
          ],
        }),
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
            rows: 4,
          }),
        ],
      }),
    ],
  });
}
export function CategoryConfigEditorModelSection({
  categoryKey,
  config,
  onUpdateConfig,
}) {
  return _jsxs("section", {
    className: "space-y-4",
    children: [
      _jsxs("div", {
        className: "space-y-1",
        children: [
          _jsx("h3", {
            className: "font-semibold",
            children: "Model Configuration",
          }),
          _jsx("p", {
            className: "text-xs text-muted-foreground",
            children:
              "Primary model, fallback chain and runtime token/sampling settings.",
          }),
        ],
      }),
      _jsx(ModelFallbackSelector, {
        primaryModel: config.model || "",
        fallbackModels: config.fallback_models || [],
        onPrimaryModelChange: (model) => onUpdateConfig("model", model),
        onFallbackModelsChange: (models) =>
          onUpdateConfig("fallback_models", models),
        agentKey: categoryKey,
      }),
      _jsxs("div", {
        className: "grid grid-cols-1 gap-4 md:grid-cols-3",
        children: [
          _jsxs("div", {
            className: "space-y-2",
            children: [
              _jsx(Label, { htmlFor: "temperature", children: "Temperature" }),
              _jsx(Input, {
                id: "temperature",
                type: "number",
                min: "0",
                max: "2",
                step: "0.1",
                value: config.temperature ?? "",
                onChange: (e) =>
                  onUpdateConfig(
                    "temperature",
                    e.target.value ? parseFloat(e.target.value) : undefined,
                  ),
                placeholder: "0.0 - 2.0",
              }),
            ],
          }),
          _jsxs("div", {
            className: "space-y-2",
            children: [
              _jsx(Label, { htmlFor: "top_p", children: "Top P" }),
              _jsx(Input, {
                id: "top_p",
                type: "number",
                min: "0",
                max: "1",
                step: "0.01",
                value: config.top_p ?? "",
                onChange: (e) =>
                  onUpdateConfig(
                    "top_p",
                    e.target.value ? parseFloat(e.target.value) : undefined,
                  ),
                placeholder: "0.0 - 1.0",
              }),
            ],
          }),
          _jsxs("div", {
            className: "space-y-2",
            children: [
              _jsx(Label, { htmlFor: "maxTokens", children: "Max Tokens" }),
              _jsx(Input, {
                id: "maxTokens",
                type: "number",
                min: "0",
                value: config.maxTokens ?? "",
                onChange: (e) =>
                  onUpdateConfig(
                    "maxTokens",
                    e.target.value ? parseInt(e.target.value, 10) : undefined,
                  ),
                placeholder: "Max tokens",
              }),
            ],
          }),
          _jsxs("div", {
            className: "space-y-2",
            children: [
              _jsx(Label, { htmlFor: "variant", children: "Variant" }),
              _jsx(Input, {
                id: "variant",
                value: config.variant || "",
                onChange: (e) => onUpdateConfig("variant", e.target.value),
                placeholder: "Enter variant",
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
