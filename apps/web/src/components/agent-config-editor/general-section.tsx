import type { SystemAgent } from "@lite-llm/contracts/agent-routing";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

interface GeneralSectionProps {
  config: SystemAgent;
  onFieldChange: (field: string, value: unknown) => void;
}

export function GeneralSection({ config, onFieldChange }: GeneralSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="agent-name">Display Name</Label>
          <Input
            id="agent-name"
            value={config.displayName}
            onChange={(e) => onFieldChange("displayName", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agent-icon">Icon</Label>
          <Input
            id="agent-icon"
            value={config.icon}
            onChange={(e) => onFieldChange("icon", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="agent-desc">Description</Label>
        <Textarea
          id="agent-desc"
          value={config.description}
          onChange={(e) => onFieldChange("description", e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="agent-color">Color</Label>
          <Input
            id="agent-color"
            type="color"
            value={config.config.color ?? "#555555"}
            onChange={(e) =>
              onFieldChange("config", {
                ...config.config,
                color: e.target.value,
              })
            }
            className="h-9 w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agent-disabled">Status</Label>
          <div className="flex items-center h-9">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.config.disable ?? false}
                onChange={(e) =>
                  onFieldChange("config", {
                    ...config.config,
                    disable: e.target.checked,
                  })
                }
                className="rounded border-input"
              />
              <span className="text-sm text-muted-foreground">Disabled</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
