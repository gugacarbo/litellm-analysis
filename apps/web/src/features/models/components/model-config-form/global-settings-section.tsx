import { Settings } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import type { ModelConfigFormData } from "../../use-model-config-page";

interface GlobalSettingsSectionProps {
  modelName: string;
  formData: ModelConfigFormData;
  onFormDataChange: (next: ModelConfigFormData) => void;
}

export function GlobalSettingsSection({
  modelName,
  formData,
  onFormDataChange,
}: GlobalSettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Global Settings
        </CardTitle>
        <CardDescription>
          Configuration sourced from the models config file. These settings
          apply to all environments.
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

        <div className="grid gap-4 sm:grid-cols-2">
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
      </CardContent>
    </Card>
  );
}
