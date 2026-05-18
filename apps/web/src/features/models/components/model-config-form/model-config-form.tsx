import type { LiteLLMCredential } from "@/shared/lib/api-client/credentials";
import type { ModelConfigFormData } from "../../../pages/model-config/use-model-config-page";
import { Button } from "../../ui/button";
import { DatabaseSettingsSection } from "./database-settings-section";
import { GlobalSettingsSection } from "./global-settings-section";

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
