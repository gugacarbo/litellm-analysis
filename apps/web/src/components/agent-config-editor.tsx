import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { normalizeSystemAgent } from "./agent-config-editor/normalize";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

interface AgentConfigEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: SystemAgent | null;
  onSave: (agent: SystemAgent) => Promise<void>;
  saving?: boolean;
}

export function AgentConfigEditor({
  open,
  onOpenChange,
  agent,
  onSave,
  saving = false,
}: AgentConfigEditorProps) {
  const [config, setConfig] = useState<SystemAgent>(() =>
    normalizeSystemAgent(agent ?? {}),
  );

  useEffect(() => {
    if (agent) {
      setConfig(normalizeSystemAgent(agent));
    }
  }, [agent]);

  const updateField = <K extends keyof SystemAgent>(
    field: K,
    value: SystemAgent[K],
  ) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const updateConfigField = <K extends keyof SystemAgent["config"]>(
    field: K,
    value: SystemAgent["config"][K],
  ) => {
    setConfig((prev) => ({
      ...prev,
      config: { ...prev.config, [field]: value },
    }));
  };

  const handleSave = async () => {
    await onSave(config);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit Agent: {config.displayName || "Unknown"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Edit configuration for {config.displayName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Display Name</Label>
              <Input
                id="agent-name"
                value={config.displayName}
                onChange={(e) => updateField("displayName", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-desc">Description</Label>
            <Textarea
              id="agent-desc"
              value={config.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agent-icon">Icon</Label>
              <Input
                id="agent-icon"
                value={config.icon}
                onChange={(e) => updateField("icon", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-color">Color</Label>
              <Input
                id="agent-color"
                type="color"
                value={config.config.color ?? "#555555"}
                onChange={(e) => updateConfigField("color", e.target.value)}
                className="h-9 w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-mode">Mode</Label>
            <select
              id="agent-mode"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={config.config.mode ?? "subagent"}
              onChange={(e) =>
                updateConfigField(
                  "mode",
                  e.target.value as "subagent" | "primary" | "all",
                )
              }
            >
              <option value="subagent">Subagent</option>
              <option value="primary">Primary</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin me-2" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
