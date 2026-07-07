import { X } from "lucide-react";
import { useMemo, useState } from "react";
import type { ModelConfigFormData } from "@/features/models/use-model-config-page";
import { Badge } from "@/shared/components/ui/badge";
import { CollapsibleSection } from "@/shared/components/ui/collapsible-section";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";

const SUPPORTED_REASONING_EFFORTS = ["low", "medium", "high", "xhigh"] as const;

interface ReasoningSectionProps {
  thinkingLevels: string[];
  reasoning: ModelConfigFormData["reasoning"];
  onUpdateThinkingLevels: (thinkingLevels: string[]) => void;
  onUpdateReasoning: (
    patch: Partial<ModelConfigFormData["reasoning"]>,
  ) => void;
}

export function ReasoningSection({
  thinkingLevels,
  reasoning,
  onUpdateThinkingLevels,
  onUpdateReasoning,
}: ReasoningSectionProps) {
  const [thinkingLevelInput, setThinkingLevelInput] = useState("");

  const availableEffortOptions = useMemo(() => {
    const normalizedSupported = new Set(SUPPORTED_REASONING_EFFORTS);
    return thinkingLevels.filter((level, index, levels) => {
      const normalized = level.trim().toLowerCase();
      return (
        normalizedSupported.has(
          normalized as (typeof SUPPORTED_REASONING_EFFORTS)[number],
        ) &&
        levels.findIndex(
          (candidate) => candidate.trim().toLowerCase() === normalized,
        ) === index
      );
    });
  }, [thinkingLevels]);

  const addThinkingLevel = () => {
    const nextLevel = thinkingLevelInput.trim();
    if (!nextLevel) {
      return;
    }

    const exists = thinkingLevels.some(
      (level) => level.trim().toLowerCase() === nextLevel.toLowerCase(),
    );
    if (!exists) {
      onUpdateThinkingLevels([...thinkingLevels, nextLevel]);
    }
    setThinkingLevelInput("");
  };

  const removeThinkingLevel = (levelToRemove: string) => {
    onUpdateThinkingLevels(
      thinkingLevels.filter(
        (level) =>
          level.trim().toLowerCase() !== levelToRemove.trim().toLowerCase(),
      ),
    );
  };

  return (
    <CollapsibleSection title="Reasoning / Thinking" defaultOpen={false}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="thinking-levels" className="text-sm font-medium">
            Thinking Levels
          </Label>
          <Input
            id="thinking-levels"
            value={thinkingLevelInput}
            onChange={(event) => setThinkingLevelInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addThinkingLevel();
              }
            }}
            placeholder="Type a level and press Enter"
          />
          {thinkingLevels.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {thinkingLevels.map((level) => (
                <Badge
                  key={level}
                  variant="outline"
                  className="gap-1 pr-1 text-xs"
                >
                  {level}
                  <button
                    type="button"
                    className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => removeThinkingLevel(level)}
                    aria-label={`Remove ${level}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Press Enter to add a thinking mode
          </p>
        </div>

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
                {availableEffortOptions.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level === "xhigh"
                      ? "Extra High"
                      : level.charAt(0).toUpperCase() + level.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Available options come from the configured thinking levels
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
