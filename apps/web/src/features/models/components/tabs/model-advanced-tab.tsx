import { Database, Plus, Trash2 } from "lucide-react";
import type { ModelConfigFormData } from "@/features/models/hooks/use-model-config-form";
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
import type { RegistryProvider } from "@/shared/lib/api-client/providers";

interface ModelAdvancedTabProps {
  formData: ModelConfigFormData;
  providers: RegistryProvider[];
  onFormDataChange: (next: ModelConfigFormData) => void;
  onAddExtraParam: () => void;
  onRemoveExtraParam: (key: string) => void;
  onUpdateExtraParam: (key: string, value: string) => void;
}

export function ModelAdvancedTab({
  formData,
  providers,
  onFormDataChange,
  onAddExtraParam,
  onRemoveExtraParam,
  onUpdateExtraParam,
}: ModelAdvancedTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Advanced Settings
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
            <Label htmlFor="provider" className="text-sm font-medium">
              Provider
              <span className="text-muted-foreground font-normal ml-1">
                (LiteLLM virtual key)
              </span>
            </Label>
            <Select
              value={formData.providerName || "none"}
              onValueChange={(value) =>
                onFormDataChange({
                  ...formData,
                  providerName: value === "none" ? "" : value,
                })
              }
            >
              <SelectTrigger id="provider">
                <SelectValue placeholder="Select a provider (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">No provider</span>
                </SelectItem>
                {providers.map((cred) => (
                  <SelectItem key={cred.providerId} value={cred.providerName}>
                    <div className="flex flex-col">
                      <span>{cred.providerName}</span>
                      {(cred.provider || cred.baseUrl) && (
                        <span className="text-xs text-muted-foreground">
                          {[cred.provider, cred.baseUrl]
                            .filter(Boolean)
                            .join(" · ")}
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
