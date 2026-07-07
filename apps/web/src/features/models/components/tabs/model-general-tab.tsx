import { useCallback } from "react";
import type { ModelConfigFormData } from "@/features/models/use-model-config-page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
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
import { ReasoningSection } from "./reasoning-section";

interface ModelGeneralTabProps {
  modelName: string;
  formData: ModelConfigFormData;
  onFormDataChange: (next: ModelConfigFormData) => void;
}

export function ModelGeneralTab({
  modelName,
  formData,
  onFormDataChange,
}: ModelGeneralTabProps) {
  const updateReasoning = useCallback(
    (patch: Partial<ModelConfigFormData["reasoning"]>) => {
      onFormDataChange({
        ...formData,
        reasoning: { ...formData.reasoning, ...patch },
      });
    },
    [formData, onFormDataChange],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>
          Configuration sourced from the models config file. These settings apply
          to all environments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Model Name</Label>
            <Input value={modelName} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">
              Immutable identifier for this model
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="display-name" className="text-sm font-medium">
              Display Name
            </Label>
            <Input
              id="display-name"
              value={formData.displayName}
              onChange={(e) =>
                onFormDataChange({ ...formData, displayName: e.target.value })
              }
              placeholder="e.g., GPT-4 Turbo"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="family" className="text-sm font-medium">
              Family
            </Label>
            <Input
              id="family"
              value={formData.family}
              onChange={(e) =>
                onFormDataChange({ ...formData, family: e.target.value })
              }
              placeholder="e.g., GPT-4"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owned-by" className="text-sm font-medium">
              Owned By
            </Label>
            <Input
              id="owned-by"
              value={formData.ownedBy}
              onChange={(e) =>
                onFormDataChange({ ...formData, ownedBy: e.target.value })
              }
              placeholder="e.g., atplus"
            />
            <p className="text-xs text-muted-foreground">
              Use <span className="font-mono">chatgpt-subscription</span> to
              route via OpenAI OAuth/Codex plan.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-mode" className="text-sm font-medium">
              API Mode
            </Label>
            <Select
              value={formData.apiMode || "none"}
              onValueChange={(value) =>
                onFormDataChange({
                  ...formData,
                  apiMode:
                    value === "none" ? "" : (value as "openai" | "anthropic"),
                })
              }
            >
              <SelectTrigger id="api-mode">
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="thinking-levels" className="text-sm font-medium">
              Thinking Levels
            </Label>
            <Input
              id="thinking-levels"
              value={formData.thinkingLevels.join(", ")}
              onChange={(e) => {
                const levels = e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                onFormDataChange({ ...formData, thinkingLevels: levels });
              }}
              placeholder="e.g., low, medium, high"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of available thinking modes
            </p>
          </div>
          <div className="flex items-center space-x-3 rounded-md border p-3">
            <Switch
              id="vision"
              checked={formData.vision}
              onCheckedChange={(checked) =>
                onFormDataChange({ ...formData, vision: checked })
              }
            />
            <div className="space-y-0.5">
              <Label
                htmlFor="vision"
                className="text-sm font-medium cursor-pointer"
              >
                Vision support
              </Label>
              <p className="text-xs text-muted-foreground">
                Model accepts image inputs
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 rounded-md border p-3">
          <Switch
            id="enabled"
            checked={formData.enabled}
            onCheckedChange={(checked) =>
              onFormDataChange({ ...formData, enabled: checked })
            }
          />
          <div className="space-y-0.5">
            <Label
              htmlFor="enabled"
              className="text-sm font-medium cursor-pointer"
            >
              Enabled for routing
            </Label>
            <p className="text-xs text-muted-foreground">
              Disable to hide from routing and selection
            </p>
          </div>
        </div>

        <ReasoningSection
          reasoning={formData.reasoning}
          onUpdateReasoning={updateReasoning}
        />
      </CardContent>
    </Card>
  );
}
