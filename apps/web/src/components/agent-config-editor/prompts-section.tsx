import type { AgentConfig } from "../../types/agent-routing";
import { Label } from "../label";
import { Textarea } from "../textarea";

type UpdateConfigFn = (
  field: keyof AgentConfig,
  value: AgentConfig[keyof AgentConfig],
) => void;

type PromptsSectionProps = {
  config: AgentConfig;
  onUpdateConfig: UpdateConfigFn;
};

export function AgentConfigEditorPromptsSection({
  config,
  onUpdateConfig,
}: PromptsSectionProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-semibold">Prompts</h3>
        <p className="text-xs text-muted-foreground">
          Prompt templates and appended context for this agent.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prompt">Prompt</Label>
        <Textarea
          id="prompt"
          value={config.prompt || ""}
          onChange={(e) => onUpdateConfig("prompt", e.target.value)}
          placeholder="Enter prompt"
          rows={8}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prompt_append">Prompt Append</Label>
        <Textarea
          id="prompt_append"
          value={config.prompt_append || ""}
          onChange={(e) => onUpdateConfig("prompt_append", e.target.value)}
          placeholder="Enter prompt append"
          rows={5}
        />
      </div>
    </section>
  );
}
