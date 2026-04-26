"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { getAllModels } from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import type { ModelConfig } from "../types/analytics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./select";

type ModelSelectorProps = {
  value?: string;
  onChange?: (model: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
};

export function ModelSelector({
  value,
  onChange,
  placeholder = "Select a model...",
  disabled = false,
  className,
  label,
}: ModelSelectorProps) {
  const modelsQuery = useQuery({
    queryKey: queryKeys.models,
    queryFn: getAllModels,
  });

  const models = (modelsQuery.data ?? []) as ModelConfig[];
  const isLoading = modelsQuery.isPending && !modelsQuery.data;
  const error =
    modelsQuery.error instanceof Error ? "Failed to load models" : null;

  const id = useMemo(
    () => `model-selector-${Math.random().toString(36).substr(2, 9)}`,
    [],
  );

  const selectedModel = useMemo(() => {
    return models.find((model) => model.modelName === value);
  }, [models, value]);

  useEffect(() => {
    if (value && models.length > 0 && !selectedModel && onChange) {
      onChange("");
    }
  }, [value, models, selectedModel, onChange]);

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium mb-2 text-foreground"
        >
          {label}
        </label>
      )}
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {error && (
            <SelectItem value="" disabled className="text-destructive">
              Error loading models
            </SelectItem>
          )}
          {isLoading ? (
            <SelectItem value="" disabled>
              Loading models...
            </SelectItem>
          ) : models.length === 0 ? (
            <SelectItem value="" disabled>
              No models available
            </SelectItem>
          ) : (
            <>
              {label && <SelectLabel>{label}</SelectLabel>}
              {models.map((model) => (
                <SelectItem key={model.modelName} value={model.modelName}>
                  {model.modelName}
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
