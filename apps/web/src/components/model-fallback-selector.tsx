"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllModels, type ModelConfig } from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { Badge } from "./badge";
import { FallbackList } from "./model-fallback-selector/fallback-list";
import { PrimaryModelSelect } from "./model-fallback-selector/primary-model-select";

interface ModelFallbackSelectorProps {
  primaryModel: string;
  fallbackModels: string[];
  onPrimaryModelChange: (model: string) => void;
  onFallbackModelsChange: (models: string[]) => void;
  agentKey: string;
}

export function ModelFallbackSelector({
  primaryModel,
  fallbackModels,
  onPrimaryModelChange,
  onFallbackModelsChange,
  agentKey,
}: ModelFallbackSelectorProps) {
  const modelsQuery = useQuery({
    queryKey: queryKeys.models,
    queryFn: getAllModels,
  });

  const availableModels = (modelsQuery.data ?? []) as ModelConfig[];

  const getPreviewAliases = () => {
    const aliases: string[] = [];
    if (primaryModel) {
      aliases.push(`${agentKey}/gpt-5.5 -> ${primaryModel}`);
    }
    fallbackModels.forEach((model, idx) => {
      if (model) {
        aliases.push(`${agentKey}/gpt-5.${4 - idx} -> ${model}`);
      }
    });
    return aliases;
  };

  return (
    <div className="space-y-4">
      <PrimaryModelSelect
        primaryModel={primaryModel}
        availableModels={availableModels}
        onPrimaryModelChange={onPrimaryModelChange}
      />

      <FallbackList
        fallbackModels={fallbackModels}
        availableModels={availableModels}
        onFallbackModelsChange={onFallbackModelsChange}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium">Litellm Alias Preview</label>
        <div className="space-y-1 text-xs">
          {getPreviewAliases().length > 0 ? (
            getPreviewAliases().map((alias, idx) => (
              <Badge key={idx} variant="secondary" className="break-all">
                {alias}
              </Badge>
            ))
          ) : (
            <p className="text-muted-foreground">No aliases will be created</p>
          )}
        </div>
      </div>
    </div>
  );
}
