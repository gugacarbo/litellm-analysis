import type { SystemAgent } from "@lite-llm/contracts/agent-routing";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getModelsWithConfig } from "@/shared/lib/api-client/models";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";

interface ModelSectionProps {
  config: SystemAgent;
  onFieldChange: (field: string, value: unknown) => void;
}

export function ModelSection({ config, onFieldChange }: ModelSectionProps) {
  const { data: modelsData } = useQuery({
    queryKey: ["models-with-config"],
    queryFn: getModelsWithConfig,
  });

  const [newFallbackModel, setNewFallbackModel] = useState("");

  const availableModels = modelsData?.models ?? [];
  const fallbackModels = config.fallbackModels ?? [];

  const addFallbackModel = () => {
    if (
      newFallbackModel.trim() &&
      !fallbackModels.includes(newFallbackModel.trim())
    ) {
      onFieldChange("fallbackModels", [
        ...fallbackModels,
        newFallbackModel.trim(),
      ]);
      setNewFallbackModel("");
    }
  };

  const removeFallbackModel = (model: string) => {
    onFieldChange(
      "fallbackModels",
      fallbackModels.filter((m) => m !== model),
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="agent-model">Primary Model</Label>
        <Input
          id="agent-model"
          value={config.model}
          onChange={(e) => onFieldChange("model", e.target.value)}
          placeholder="e.g., claude-3-5-sonnet"
          list="model-suggestions"
        />
        <datalist id="model-suggestions">
          {availableModels.map((m) => (
            <option key={m.modelName} value={m.modelName} />
          ))}
        </datalist>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fallback-input">Fallback Models</Label>
        <div className="flex gap-2">
          <Input
            id="fallback-input"
            value={newFallbackModel}
            onChange={(e) => setNewFallbackModel(e.target.value)}
            placeholder="Add fallback model"
            list="model-suggestions"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFallbackModel();
              }
            }}
          />
          <button
            type="button"
            onClick={addFallbackModel}
            className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90"
          >
            Add
          </button>
        </div>
        {fallbackModels.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {fallbackModels.map((model) => (
              <span
                key={model}
                className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-muted rounded-md"
              >
                {model}
                <button
                  type="button"
                  onClick={() => removeFallbackModel(model)}
                  className="text-muted-foreground hover:text-foreground ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="context-limit">Context Limit</Label>
          <Input
            id="context-limit"
            type="number"
            value={config.limits.context}
            onChange={(e) =>
              onFieldChange("limits", {
                ...config.limits,
                context: parseInt(e.target.value, 10) || 0,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="output-limit">Output Limit</Label>
          <Input
            id="output-limit"
            type="number"
            value={config.limits.output}
            onChange={(e) =>
              onFieldChange("limits", {
                ...config.limits,
                output: parseInt(e.target.value, 10) || 0,
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
