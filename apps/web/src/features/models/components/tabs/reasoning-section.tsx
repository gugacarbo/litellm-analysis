import type { ModelConfigFormData } from "@/features/models/use-model-config-page";
import { CollapsibleSection } from "@/shared/components/ui/collapsible-section";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";

interface ReasoningSectionProps {
  reasoning: ModelConfigFormData["reasoning"];
  onUpdateReasoning: (
    patch: Partial<ModelConfigFormData["reasoning"]>,
  ) => void;
}

export function ReasoningSection({
  reasoning,
  onUpdateReasoning,
}: ReasoningSectionProps) {
  return (
    <CollapsibleSection title="Reasoning / Thinking" defaultOpen={false}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="reasoning-effort" className="text-sm font-medium">
              Reasoning Effort
            </Label>
            <Select
              value={reasoning.effort || "none"}
              onValueChange={(value) =>
                onUpdateReasoning({
                  effort:
                    value === "none"
                      ? ""
                      : (value as ModelConfigFormData["reasoning"]["effort"]),
                })
              }
            >
              <SelectTrigger id="reasoning-effort">
                <SelectValue placeholder="Select effort level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default / none</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="xhigh">Extra High</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Maps to reasoning_effort in VS Code / OpenCode
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="reasoning-api-mode"
              className="text-sm font-medium"
            >
              API Mode
            </Label>
            <Select
              value={reasoning.apiMode || "none"}
              onValueChange={(value) =>
                onUpdateReasoning({
                  apiMode:
                    value === "none" ? "" : (value as "openai" | "anthropic"),
                })
              }
            >
              <SelectTrigger id="reasoning-api-mode">
                <SelectValue placeholder="Select API mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">Default</span>
                </SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <label className="flex items-center gap-2">
            <Switch
              id="enable-thinking"
              checked={reasoning.enableThinking}
              onCheckedChange={(checked) =>
                onUpdateReasoning({ enableThinking: checked })
              }
            />
            <span className="text-sm">Enable thinking</span>
          </label>

          <label className="flex items-center gap-2">
            <Switch
              id="include-reasoning"
              checked={reasoning.includeReasoningInRequest}
              onCheckedChange={(checked) =>
                onUpdateReasoning({ includeReasoningInRequest: checked })
              }
            />
            <span className="text-sm">Include reasoning in request</span>
          </label>
        </div>
      </div>
    </CollapsibleSection>
  );
}
