import { Database, Plus, Trash2 } from "lucide-react";
import type { LiteLLMCredential } from "@/shared/lib/api-client/credentials";
import type { ModelConfigFormData } from "../../../pages/model-config/use-model-config-page";
import { Button } from "../../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

interface DatabaseSettingsSectionProps {
  formData: ModelConfigFormData;
  credentials: LiteLLMCredential[];
  onFormDataChange: (next: ModelConfigFormData) => void;
  onAddExtraParam: () => void;
  onRemoveExtraParam: (key: string) => void;
  onUpdateExtraParam: (key: string, value: string) => void;
}

export function DatabaseSettingsSection({
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
