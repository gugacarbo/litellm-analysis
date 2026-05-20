import type { SystemAgent } from "@lite-llm/contracts/agent-routing";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { getModelsWithConfig } from "@/shared/lib/api-client/models";

interface ModelSectionProps {
  config: SystemAgent;
  onFieldChange: (field: string, value: unknown) => void;
}

export function ModelSection({ config, onFieldChange }: ModelSectionProps) {
  const { data: modelsData } = useQuery({
    queryKey: ["models-with-config"],
    queryFn: getModelsWithConfig,
  });

  const availableModels = modelsData?.models ?? [];

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
