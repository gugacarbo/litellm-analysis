import { Database, Plus, Settings, Trash2 } from "lucide-react";
import type { ModelConfigFormData } from "@/features/models/use-model-config-page";
import { Button } from "@/shared/components/ui/button";
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
import type { LiteLLMCredential } from "@/shared/lib/api-client/credentials";

interface ModelConfigFormProps {
  modelName: string;
  formData: ModelConfigFormData;
  credentials: LiteLLMCredential[];
  onFormDataChange: (next: ModelConfigFormData) => void;
  onAddExtraParam: () => void;
  onRemoveExtraParam: (key: string) => void;
  onUpdateExtraParam: (key: string, value: string) => void;
  onSave: () => void;
  onBack: () => void;
  saving: boolean;
  isDirty: boolean;
}

export function ModelConfigForm({
  modelName,
  formData,
  credentials,
  onFormDataChange,
  onAddExtraParam,
  onRemoveExtraParam,
  onUpdateExtraParam,
  onSave,
  onBack,
  saving,
  isDirty,
}: ModelConfigFormProps) {
  return (
    <div className="space-y-6">
      <GlobalSettingsSection
        modelName={modelName}
        formData={formData}
        onFormDataChange={onFormDataChange}
      />
      <DatabaseSettingsSection
        formData={formData}
        credentials={credentials}
        onFormDataChange={onFormDataChange}
        onAddExtraParam={onAddExtraParam}
        onRemoveExtraParam={onRemoveExtraParam}
        onUpdateExtraParam={onUpdateExtraParam}
      />
      <div className="flex items-center justify-between border-t pt-4">
        <p className="text-sm text-muted-foreground">
          {isDirty ? "You have unsaved changes" : "No unsaved changes"}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onSave} disabled={saving || !isDirty}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface GlobalSettingsSectionProps {
  modelName: string;
  formData: ModelConfigFormData;
  onFormDataChange: (next: ModelConfigFormData) => void;
}

function GlobalSettingsSection({
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

interface DatabaseSettingsSectionProps {
  formData: ModelConfigFormData;
  credentials: LiteLLMCredential[];
  onFormDataChange: (next: ModelConfigFormData) => void;
  onAddExtraParam: () => void;
  onRemoveExtraParam: (key: string) => void;
  onUpdateExtraParam: (key: string, value: string) => void;
}

function DatabaseSettingsSection({
  formData,
  credentials,
  onFormDataChange,
  onAddExtraParam,
  onRemoveExtraParam,
  onUpdateExtraParam,
}: DatabaseSettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Settings
        </CardTitle>
        <CardDescription>
          LiteLLM database parameters. These settings are environment-specific.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="api-base" className="text-sm font-medium">
              API Base URL
            </Label>
            <Input
              id="api-base"
              value={formData.apiBase}
              onChange={(e) =>
                onFormDataChange({ ...formData, apiBase: e.target.value })
              }
              placeholder="https://api.openai.com/v1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="credential" className="text-sm font-medium">
              Credential
              <span className="text-muted-foreground font-normal ml-1">
                (LiteLLM virtual key)
              </span>
            </Label>
            <Select
              value={formData.credentialName || "none"}
              onValueChange={(value) =>
                onFormDataChange({
                  ...formData,
                  credentialName: value === "none" ? "" : value,
                })
              }
            >
              <SelectTrigger id="credential">
                <SelectValue placeholder="Select a credential (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">No credential</span>
                </SelectItem>
                {credentials.map((cred) => (
                  <SelectItem
                    key={cred.credentialId}
                    value={cred.credentialName}
                  >
                    <div className="flex flex-col">
                      <span>{cred.credentialName}</span>
                      {cred.credentialInfo && (
                        <span className="text-xs text-muted-foreground">
                          {JSON.stringify(cred.credentialInfo).slice(0, 50)}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="input-cost" className="text-sm font-medium">
              Input Cost
              <span className="text-muted-foreground font-normal ml-1">
                ($/token)
              </span>
            </Label>
            <Input
              id="input-cost"
              type="number"
              step="0.000001"
              min="0"
              value={formData.inputCostPerToken}
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  inputCostPerToken: e.target.value,
                })
              }
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="output-cost" className="text-sm font-medium">
              Output Cost
              <span className="text-muted-foreground font-normal ml-1">
                ($/token)
              </span>
            </Label>
            <Input
              id="output-cost"
              type="number"
              step="0.000001"
              min="0"
              value={formData.outputCostPerToken}
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  outputCostPerToken: e.target.value,
                })
              }
              placeholder="0.00"
            />
          </div>
        </div>

        {Object.keys(formData.extraParams).length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Extra Parameters</Label>
            {Object.entries(formData.extraParams).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <Input
                  value={key}
                  onChange={(e) => {
                    const oldKey = key;
                    const newKey = e.target.value;
                    const newParams = { ...formData.extraParams };
                    delete newParams[oldKey];
                    if (newKey) {
                      newParams[newKey] = value;
                    }
                    onFormDataChange({
                      ...formData,
                      extraParams: newParams,
                    });
                  }}
                  className="bg-muted font-mono text-sm"
                  placeholder="param_name"
                />
                <Input
                  value={value}
                  onChange={(e) => onUpdateExtraParam(key, e.target.value)}
                  className="font-mono text-sm"
                  placeholder="value"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onRemoveExtraParam(key)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddExtraParam}
          className="w-fit"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Parameter
        </Button>
      </CardContent>
    </Card>
  );
}
