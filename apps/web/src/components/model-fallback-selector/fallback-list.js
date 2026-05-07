"use client";
import { Plus, Trash2 } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const NONE_VALUE = "__none__";
export function FallbackList({
  fallbackModels,
  availableModels,
  onFallbackModelsChange,
}) {
  const addFallbackModel = () => {
    onFallbackModelsChange([...fallbackModels, ""]);
  };
  const updateFallbackModel = (index, model) => {
    const resolved = model === NONE_VALUE ? "" : model;
    const newFallbacks = [...fallbackModels];
    newFallbacks[index] = resolved;
    onFallbackModelsChange(newFallbacks);
  };
  const removeFallbackModel = (index) => {
    const newFallbacks = [...fallbackModels];
    newFallbacks.splice(index, 1);
    onFallbackModelsChange(newFallbacks);
  };
  return _jsxs("div", {
    className: "space-y-2",
    children: [
      _jsxs("div", {
        className: "flex items-center justify-between",
        children: [
          _jsxs("label", {
            className: "text-sm font-medium",
            children: [
              "Fallback Models",
              _jsx("span", {
                className: "text-muted-foreground text-xs ms-1",
                children: "(max 3, global fallback gpt-5.1 is always last)",
              }),
            ],
          }),
          _jsxs(Button, {
            type: "button",
            variant: "outline",
            size: "sm",
            onClick: addFallbackModel,
            disabled: fallbackModels.length >= 3,
            children: [_jsx(Plus, { className: "h-3 w-3" }), "Add Fallback"],
          }),
        ],
      }),
      fallbackModels.length === 0
        ? _jsx("p", {
            className: "text-sm text-muted-foreground",
            children: "No fallback models configured",
          })
        : _jsx("div", {
            className: "space-y-2",
            children: fallbackModels.map((model, index) =>
              _jsxs(
                "div",
                {
                  className: "flex items-center gap-2",
                  children: [
                    _jsxs(Select, {
                      value: model || NONE_VALUE,
                      onValueChange: (value) =>
                        updateFallbackModel(index, value),
                      children: [
                        _jsx(SelectTrigger, {
                          className: "flex-1",
                          children: _jsx(SelectValue, {
                            placeholder: "Select fallback model",
                          }),
                        }),
                        _jsxs(SelectContent, {
                          children: [
                            _jsx(SelectItem, {
                              value: NONE_VALUE,
                              children: "None",
                            }),
                            availableModels.map((m) =>
                              _jsx(
                                SelectItem,
                                { value: m.modelName, children: m.modelName },
                                m.modelName,
                              ),
                            ),
                          ],
                        }),
                      ],
                    }),
                    _jsx(Button, {
                      type: "button",
                      variant: "outline",
                      size: "sm",
                      onClick: () => removeFallbackModel(index),
                      children: _jsx(Trash2, { className: "h-3 w-3" }),
                    }),
                  ],
                },
                index,
              ),
            ),
          }),
    ],
  });
}
