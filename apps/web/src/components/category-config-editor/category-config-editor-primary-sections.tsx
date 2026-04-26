import type { CategoryConfig } from "../../types/agent-routing";
import { Input } from "../input";
import { Label } from "../label";
import { ModelFallbackSelector } from "../model-fallback-selector";
import { Textarea } from "../textarea";

type UpdateConfigFn = (
  field: keyof CategoryConfig,
  value: CategoryConfig[keyof CategoryConfig],
) => void;

type BasicSectionProps = {
  config: CategoryConfig;
  onUpdateConfig: UpdateConfigFn;
};

type ModelSectionProps = {
  categoryKey: string;
  config: CategoryConfig;
  onUpdateConfig: UpdateConfigFn;
};

export function CategoryConfigEditorBasicSection({
  config,
  onUpdateConfig,
}: BasicSectionProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-semibold">Basic Information</h3>
        <p className="text-xs text-muted-foreground">
          Visibility flags and contextual description for this category.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            checked={!!config.is_unstable_agent}
            onChange={(e) =>
              onUpdateConfig("is_unstable_agent", e.target.checked)
            }
            className="h-4 w-4"
          />
          <Label>Is Unstable Agent</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={config.description || ""}
          onChange={(e) => onUpdateConfig("description", e.target.value)}
          placeholder="Enter description"
          rows={4}
        />
      </div>
    </section>
  );
}

export function CategoryConfigEditorModelSection({
  categoryKey,
  config,
  onUpdateConfig,
}: ModelSectionProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-semibold">Model Configuration</h3>
        <p className="text-xs text-muted-foreground">
          Primary model, fallback chain and runtime token/sampling settings.
        </p>
      </div>

      <ModelFallbackSelector
        primaryModel={config.model || ""}
        fallbackModels={config.fallback_models || []}
        onPrimaryModelChange={(model) => onUpdateConfig("model", model)}
        onFallbackModelsChange={(models) =>
          onUpdateConfig("fallback_models", models)
        }
        agentKey={categoryKey}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="temperature">Temperature</Label>
          <Input
            id="temperature"
            type="number"
            min="0"
            max="2"
            step="0.1"
            value={config.temperature ?? ""}
            onChange={(e) =>
              onUpdateConfig(
                "temperature",
                e.target.value ? parseFloat(e.target.value) : undefined,
              )
            }
            placeholder="0.0 - 2.0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="top_p">Top P</Label>
          <Input
            id="top_p"
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={config.top_p ?? ""}
            onChange={(e) =>
              onUpdateConfig(
                "top_p",
                e.target.value ? parseFloat(e.target.value) : undefined,
              )
            }
            placeholder="0.0 - 1.0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxTokens">Max Tokens</Label>
          <Input
            id="maxTokens"
            type="number"
            min="0"
            value={config.maxTokens ?? ""}
            onChange={(e) =>
              onUpdateConfig(
                "maxTokens",
                e.target.value ? parseInt(e.target.value, 10) : undefined,
              )
            }
            placeholder="Max tokens"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="variant">Variant</Label>
          <Input
            id="variant"
            value={config.variant || ""}
            onChange={(e) => onUpdateConfig("variant", e.target.value)}
            placeholder="Enter variant"
          />
        </div>
      </div>
    </section>
  );
}
