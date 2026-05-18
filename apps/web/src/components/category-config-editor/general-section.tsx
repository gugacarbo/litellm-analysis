import type { CategoryEntry } from "@lite-llm/contracts/category";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

type GeneralSectionProps = {
  categoryKey: string;
  category: CategoryEntry;
  onKeyChange: (key: string) => void;
  onUpdate: <K extends keyof CategoryEntry>(
    field: K,
    value: CategoryEntry[K],
  ) => void;
  isNew?: boolean;
};

export function GeneralSection({
  categoryKey,
  category,
  onKeyChange,
  onUpdate,
  isNew = false,
}: GeneralSectionProps) {
  const handleLimitsChange = (field: "context" | "output", value: string) => {
    const num = parseInt(value, 10) || 0;
    onUpdate("limits", {
      context: category.limits?.context ?? 200000,
      output: category.limits?.output ?? 32768,
      [field]: num,
    });
  };

  const handleCostChange = (field: "input" | "output", value: string) => {
    const num = parseFloat(value) || 0;
    onUpdate("cost", {
      input: category.cost?.input ?? 0,
      output: category.cost?.output ?? 0,
      [field]: num,
    });
  };

  return (
    <div className="space-y-4">
      {isNew && (
        <div className="space-y-2">
          <Label htmlFor="cat-key">Category Key</Label>
          <Input
            id="cat-key"
            value={categoryKey}
            onChange={(e) => onKeyChange(e.target.value)}
            placeholder="e.g., coding, analysis, general"
          />
          <p className="text-xs text-muted-foreground">
            Unique identifier for this category
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="cat-model">Model</Label>
        <Input
          id="cat-model"
          value={category.model}
          onChange={(e) => onUpdate("model", e.target.value)}
          placeholder="e.g., gpt-4o, claude-3-5-sonnet"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cat-fallbacks">Fallback Models</Label>
        <Input
          id="cat-fallbacks"
          value={category.fallbackModels?.join(", ") ?? ""}
          onChange={(e) =>
            onUpdate(
              "fallbackModels",
              e.target.value
                .split(",")
                .map((m) => m.trim())
                .filter(Boolean),
            )
          }
          placeholder="comma-separated model names"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cat-icon">Icon</Label>
          <Input
            id="cat-icon"
            value={category.icon ?? ""}
            onChange={(e) => onUpdate("icon", e.target.value)}
            placeholder="e.g., 📂"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cat-variant">Variant</Label>
          <Input
            id="cat-variant"
            value={category.variant ?? ""}
            onChange={(e) => onUpdate("variant", e.target.value)}
            placeholder="optional variant"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cat-context-limit">Context Limit</Label>
          <Input
            id="cat-context-limit"
            type="number"
            value={category.limits?.context ?? 200000}
            onChange={(e) => handleLimitsChange("context", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cat-output-limit">Output Limit</Label>
          <Input
            id="cat-output-limit"
            type="number"
            value={category.limits?.output ?? 32768}
            onChange={(e) => handleLimitsChange("output", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cat-cost-input">Input Cost ($/M tokens)</Label>
          <Input
            id="cat-cost-input"
            type="number"
            step="0.01"
            value={category.cost?.input ?? ""}
            onChange={(e) => handleCostChange("input", e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cat-cost-output">Output Cost ($/M tokens)</Label>
          <Input
            id="cat-cost-output"
            type="number"
            step="0.01"
            value={category.cost?.output ?? ""}
            onChange={(e) => handleCostChange("output", e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cat-temp">Temperature</Label>
          <Input
            id="cat-temp"
            type="number"
            step="0.1"
            min="0"
            max="2"
            value={category.temperature ?? 0}
            onChange={(e) =>
              onUpdate("temperature", parseFloat(e.target.value) || 0)
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cat-topp">Top P</Label>
          <Input
            id="cat-topp"
            type="number"
            step="0.05"
            min="0"
            max="1"
            value={category.topP ?? 1}
            onChange={(e) => onUpdate("topP", parseFloat(e.target.value) || 1)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cat-desc">Description</Label>
        <Textarea
          id="cat-desc"
          value={category.description ?? ""}
          onChange={(e) => onUpdate("description", e.target.value)}
          rows={2}
          placeholder="Category description"
        />
      </div>
    </div>
  );
}
