"use client";

import { X } from "lucide-react";
import { useState } from "react";
import type { ModelConfig } from "../../lib/api-client";
import { Button } from "../button";
import { Input } from "../input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";

const NONE_VALUE = "__none__";

interface PrimaryModelSelectProps {
  primaryModel: string;
  availableModels: ModelConfig[];
  onPrimaryModelChange: (model: string) => void;
}

export function PrimaryModelSelect({
  primaryModel,
  availableModels,
  onPrimaryModelChange,
}: PrimaryModelSelectProps) {
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [customModelName, setCustomModelName] = useState("");

  const clearPrimaryModel = () => {
    onPrimaryModelChange("");
    setUseCustomModel(false);
    setCustomModelName("");
  };

  const handlePrimarySelect = (value: string) => {
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

  const getSelectValue = (modelValue: string) => {
    if (!modelValue) return NONE_VALUE;
    const isKnown = availableModels.some((m) => m.modelName === modelValue);
    return isKnown ? modelValue : "__custom__";
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Primary Model</label>
      <div className="flex items-center gap-2">
        {useCustomModel ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={customModelName}
              onChange={(e) => setCustomModelName(e.target.value)}
              placeholder="e.g. litellm/qwen3.5-plus"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCustomModelConfirm();
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCustomModelConfirm}
            >
              Apply
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearPrimaryModel}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <Select
              value={getSelectValue(primaryModel)}
              onValueChange={handlePrimarySelect}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select primary model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {availableModels.map((model) => (
                  <SelectItem key={model.modelName} value={model.modelName}>
                    {model.modelName}
                  </SelectItem>
                ))}
                <SelectItem value="__custom__">Custom model...</SelectItem>
              </SelectContent>
            </Select>
            {primaryModel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearPrimaryModel}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
      {primaryModel && !useCustomModel && (
        <p className="text-xs text-muted-foreground">Current: {primaryModel}</p>
      )}
    </div>
  );
}
