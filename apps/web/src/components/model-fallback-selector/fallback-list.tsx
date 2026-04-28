"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ModelConfig } from "../../lib/api-client";
import { Button } from "../button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";

const NONE_VALUE = "__none__";

interface FallbackListProps {
  fallbackModels: string[];
  availableModels: ModelConfig[];
  onFallbackModelsChange: (models: string[]) => void;
}

export function FallbackList({
  fallbackModels,
  availableModels,
  onFallbackModelsChange,
}: FallbackListProps) {
  const addFallbackModel = () => {
    onFallbackModelsChange([...fallbackModels, ""]);
  };

  const updateFallbackModel = (index: number, model: string) => {
    const resolved = model === NONE_VALUE ? "" : model;
    const newFallbacks = [...fallbackModels];
    newFallbacks[index] = resolved;
    onFallbackModelsChange(newFallbacks);
  };

  const removeFallbackModel = (index: number) => {
    const newFallbacks = [...fallbackModels];
    newFallbacks.splice(index, 1);
    onFallbackModelsChange(newFallbacks);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Fallback Models
          <span className="text-muted-foreground text-xs ms-1">
            (max 3, global fallback gpt-5.1 is always last)
          </span>
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addFallbackModel}
          disabled={fallbackModels.length >= 3}
        >
          <Plus className="h-3 w-3" />
          Add Fallback
        </Button>
      </div>

      {fallbackModels.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No fallback models configured
        </p>
      ) : (
        <div className="space-y-2">
          {fallbackModels.map((model, index) => (
            <div key={index} className="flex items-center gap-2">
              <Select
                value={model || NONE_VALUE}
                onValueChange={(value) => updateFallbackModel(index, value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select fallback model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {availableModels.map((m) => (
                    <SelectItem key={m.modelName} value={m.modelName}>
                      {m.modelName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeFallbackModel(index)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
