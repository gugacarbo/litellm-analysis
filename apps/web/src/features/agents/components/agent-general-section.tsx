import type { SystemAgent } from "@lite-llm/contracts/agent-routing";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";

type AgentGeneralSectionProps = {
  config: SystemAgent;
  onFieldChange: (field: string, value: unknown) => void;
};

export function AgentGeneralSection({
  config,
  onFieldChange,
}: AgentGeneralSectionProps) {
  const handleLimitsChange = (field: "context" | "output", value: string) => {
    const num = parseInt(value, 10) || 0;
    onFieldChange("limits", {
      context: config.limits?.context ?? 200000,
      output: config.limits?.output ?? 32768,
      [field]: num,
    });
  };

  const handleCostChange = (field: "input" | "output", value: string) => {
    const num = parseFloat(value) || 0;
    onFieldChange("cost", {
      input: config.cost?.input ?? 0,
      output: config.cost?.output ?? 0,
      [field]: num,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="agent-display-name">Display Name</Label>
        <Input
          id="agent-display-name"
          value={config.displayName ?? ""}
          onChange={(e) => onFieldChange("displayName", e.target.value)}
          placeholder="Agent display name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="agent-model">Model</Label>
        <Input
          id="agent-model"
          value={config.model ?? ""}
          onChange={(e) => onFieldChange("model", e.target.value)}
          placeholder="e.g., gpt-4o, claude-3-5-sonnet"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="agent-icon">Icon</Label>
          <Input
            id="agent-icon"
            value={config.icon ?? ""}
            onChange={(e) => onFieldChange("icon", e.target.value)}
            placeholder="e.g., 🤖"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agent-variant">Variant</Label>
          <Input
            id="agent-variant"
            value={config.config?.variant ?? ""}
            onChange={(e) =>
              onFieldChange("config", {
                ...config.config,
                variant: e.target.value,
              })
            }
            placeholder="optional variant"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="agent-color">Color</Label>
        <div className="flex items-center gap-2">
          <Input
            id="agent-color"
            type="color"
            value={config.config?.color ?? "#555555"}
            onChange={(e) =>
              onFieldChange("config", {
                ...config.config,
                color: e.target.value,
              })
            }
            className="h-10 w-14 p-1"
          />
          <Input
            value={config.config?.color ?? ""}
            onChange={(e) =>
              onFieldChange("config", {
                ...config.config,
                color: e.target.value,
              })
            }
            placeholder="#1ABC9C"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="agent-context-limit">Context Limit</Label>
          <Input
            id="agent-context-limit"
            type="number"
            value={config.limits?.context ?? 200000}
            onChange={(e) => handleLimitsChange("context", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agent-output-limit">Output Limit</Label>
          <Input
            id="agent-output-limit"
            type="number"
            value={config.limits?.output ?? 32768}
            onChange={(e) => handleLimitsChange("output", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="agent-cost-input">Input Cost ($/token)</Label>
          <Input
            id="agent-cost-input"
            type="number"
            step="0.000001"
            value={config.cost?.input ?? ""}
            onChange={(e) => handleCostChange("input", e.target.value)}
            placeholder="0.000000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agent-cost-output">Output Cost ($/token)</Label>
          <Input
            id="agent-cost-output"
            type="number"
            step="0.000001"
            value={config.cost?.output ?? ""}
            onChange={(e) => handleCostChange("output", e.target.value)}
            placeholder="0.000000"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="agent-temp">Temperature</Label>
          <Input
            id="agent-temp"
            type="number"
            step="0.1"
            min="0"
            max="2"
            value={config.config?.temperature ?? 0}
            onChange={(e) =>
              onFieldChange("config", {
                ...config.config,
                temperature: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agent-topp">Top P</Label>
          <Input
            id="agent-topp"
            type="number"
            step="0.05"
            min="0"
            max="1"
            value={config.config?.topP ?? 1}
            onChange={(e) =>
              onFieldChange("config", {
                ...config.config,
                topP: parseFloat(e.target.value) || 1,
              })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="agent-desc">Description</Label>
        <Textarea
          id="agent-desc"
          value={config.description ?? ""}
          onChange={(e) => onFieldChange("description", e.target.value)}
          rows={2}
          placeholder="Agent description"
        />
      </div>
    </div>
  );
}
