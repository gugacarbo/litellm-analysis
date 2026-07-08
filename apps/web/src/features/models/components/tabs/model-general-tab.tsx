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

  const updateThinkingLevels = useCallback(
    (thinkingLevels: string[]) => {
      const activeEffort = formData.reasoning.effort;
      const normalizedLevels = new Set(
        thinkingLevels.map((level) => level.trim().toLowerCase()),
      );
      const nextReasoning =
        activeEffort && !normalizedLevels.has(activeEffort.toLowerCase())
          ? { ...formData.reasoning, effort: "" }
          : formData.reasoning;

      onFormDataChange({
        ...formData,
        thinkingLevels,
        reasoning: nextReasoning,
      });
    },
    [formData, onFormDataChange],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Configuration sourced from the models config file. These settings
            apply to all environments.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 rounded-md border px-3 py-2">
          <Label htmlFor="enabled" className="cursor-pointer text-sm font-medium">
            Enabled
          </Label>
          <Switch
            id="enabled"
            checked={formData.enabled}
            onCheckedChange={(checked) =>
              onFormDataChange({ ...formData, enabled: checked })
            }
          />
        </div>
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
              placeholder="e.g., openai"
            />
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

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-md border px-3 py-2 sm:self-end">
            <div className="space-y-0.5">
              <Label
                htmlFor="vision"
                className="cursor-pointer text-sm font-medium"
              >
                Vision
              </Label>
              <p className="text-xs text-muted-foreground">Image inputs</p>
            </div>
            <Switch
              id="vision"
              checked={formData.vision}
              onCheckedChange={(checked) =>
                onFormDataChange({ ...formData, vision: checked })
              }
            />
          </div>
        </div>

        <ReasoningSection
          thinkingLevels={formData.thinkingLevels}
          reasoning={formData.reasoning}
          onUpdateThinkingLevels={updateThinkingLevels}
          onUpdateReasoning={updateReasoning}
        />
      </CardContent>
    </Card>
  );
}
