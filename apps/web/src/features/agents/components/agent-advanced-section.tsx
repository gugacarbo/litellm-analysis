import type { SystemAgent } from "@lite-llm/contracts/agent-routing";
import { ChevronDown } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";

type AgentAdvancedSectionProps = {
  config: SystemAgent;
  onConfigFieldChange: (field: string, value: unknown) => void;
};

export function AgentAdvancedSection({
  config,
  onConfigFieldChange,
}: AgentAdvancedSectionProps) {
  const extraConfig = config.config ?? {};

  const renderSection = (
    _id: string,
    title: string,
    content: React.ReactNode,
  ) => (
    <div className="border rounded-lg">
      <Button
        variant="ghost"
        className="w-full justify-between px-4 py-2 h-auto font-medium"
        onClick={() => {}}
      >
        {title}
        <ChevronDown className="h-4 w-4" />
      </Button>
      <div className="px-4 pb-4 space-y-2">{content}</div>
    </div>
  );

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">Advanced</h4>

      {renderSection(
        "prompt",
        "Prompt Configuration",
        <div className="space-y-2">
          <Label htmlFor="agent-prompt-append">Prompt Append</Label>
          <Textarea
            id="agent-prompt-append"
            value={extraConfig.promptAppend ?? ""}
            onChange={(e) => onConfigFieldChange("promptAppend", e.target.value)}
            rows={3}
            placeholder="Text to append to all prompts"
          />
        </div>,
      )}

      {renderSection(
        "tools",
        "Tools Configuration",
        <div className="space-y-2">
          <Label htmlFor="agent-tools">Tools (JSON)</Label>
          <Textarea
            id="agent-tools"
            value={
              extraConfig.tools ? JSON.stringify(extraConfig.tools, null, 2) : "{}"
            }
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value || "{}");
                onConfigFieldChange("tools", parsed);
              } catch {
                // Invalid JSON, ignore
              }
            }}
            rows={4}
            placeholder='{"tool_name": true}'
          />
          <p className="text-xs text-muted-foreground">
            Enable/disable tools for this agent
          </p>
        </div>,
      )}

      {renderSection(
        "permissions",
        "Permissions",
        <div className="space-y-2">
          <Label htmlFor="agent-permissions">Permissions (JSON)</Label>
          <Textarea
            id="agent-permissions"
            value={
              extraConfig.permissions
                ? JSON.stringify(extraConfig.permissions, null, 2)
                : "{}"
            }
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value || "{}");
                onConfigFieldChange("permissions", parsed);
              } catch {
                // Invalid JSON, ignore
              }
            }}
            rows={4}
            placeholder='{"permission_name": true}'
          />
          <p className="text-xs text-muted-foreground">
            Configure agent permissions
          </p>
        </div>,
      )}
    </div>
  );
}
