"use client";
import { X } from "lucide-react";
import { useState } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const NONE_VALUE = "__none__";
export function PrimaryModelSelect({
  primaryModel,
  availableModels,
  onPrimaryModelChange,
}) {
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [customModelName, setCustomModelName] = useState("");
  const clearPrimaryModel = () => {
    onPrimaryModelChange("");
    setUseCustomModel(false);
    setCustomModelName("");
  };
  const handlePrimarySelect = (value) => {
    if (value === NONE_VALUE) {
      onPrimaryModelChange("");
      setUseCustomModel(false);
    } else if (value === "__custom__") {
      setUseCustomModel(true);
      setCustomModelName("");
      onPrimaryModelChange("");
    } else {
      onPrimaryModelChange(value);
      setUseCustomModel(false);
    }
  };
  const handleCustomModelConfirm = () => {
    if (customModelName.trim()) {
      onPrimaryModelChange(customModelName.trim());
    }
  };
  const getSelectValue = (modelValue) => {
    if (!modelValue) return NONE_VALUE;
    const isKnown = availableModels.some((m) => m.modelName === modelValue);
    return isKnown ? modelValue : "__custom__";
  };
  return _jsxs("div", {
    className: "space-y-2",
    children: [
      _jsx("label", {
        className: "text-sm font-medium",
        children: "Primary Model",
      }),
      _jsx("div", {
        className: "flex items-center gap-2",
        children: useCustomModel
          ? _jsxs("div", {
              className: "flex items-center gap-2 flex-1",
              children: [
                _jsx(Input, {
                  value: customModelName,
                  onChange: (e) => setCustomModelName(e.target.value),
                  placeholder: "e.g. litellm/qwen3.5-plus",
                  className: "flex-1",
                  onKeyDown: (e) => {
                    if (e.key === "Enter") handleCustomModelConfirm();
                  },
                }),
                _jsx(Button, {
                  type: "button",
                  variant: "outline",
                  size: "sm",
                  onClick: handleCustomModelConfirm,
                  children: "Apply",
                }),
                _jsx(Button, {
                  type: "button",
                  variant: "ghost",
                  size: "sm",
                  onClick: clearPrimaryModel,
                  children: _jsx(X, { className: "h-3 w-3" }),
                }),
              ],
            })
          : _jsxs("div", {
              className: "flex items-center gap-2 flex-1",
              children: [
                _jsxs(Select, {
                  value: getSelectValue(primaryModel),
                  onValueChange: handlePrimarySelect,
                  children: [
                    _jsx(SelectTrigger, {
                      className: "flex-1",
                      children: _jsx(SelectValue, {
                        placeholder: "Select primary model",
                      }),
                    }),
                    _jsxs(SelectContent, {
                      children: [
                        _jsx(SelectItem, {
                          value: NONE_VALUE,
                          children: "None",
                        }),
                        availableModels.map((model) =>
                          _jsx(
                            SelectItem,
                            {
                              value: model.modelName,
                              children: model.modelName,
                            },
                            model.modelName,
                          ),
                        ),
                        _jsx(SelectItem, {
                          value: "__custom__",
                          children: "Custom model...",
                        }),
                      ],
                    }),
                  ],
                }),
                primaryModel &&
                  _jsx(Button, {
                    type: "button",
                    variant: "ghost",
                    size: "sm",
                    onClick: clearPrimaryModel,
                    children: _jsx(X, { className: "h-3 w-3" }),
                  }),
              ],
            }),
      }),
      primaryModel &&
        !useCustomModel &&
        _jsxs("p", {
          className: "text-xs text-muted-foreground",
          children: ["Current: ", primaryModel],
        }),
    ],
  });
}
