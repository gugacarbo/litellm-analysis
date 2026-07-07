import { Button } from "@/shared/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import type { ModelConfigFormData } from "@/features/models/use-model-config-page";
import type { RegistryProvider } from "@/shared/lib/api-client/providers";
import type { ModelWithStatus } from "@/shared/lib/api-client/models";
import { ModelAdvancedTab } from "./tabs/model-advanced-tab";
import { ModelGeneralTab } from "./tabs/model-general-tab";
import { ModelRoutingTab } from "./tabs/model-routing-tab";

export interface ModelConfigController {
  model: ModelWithStatus | null;
  formData: ModelConfigFormData;
  isDirty: boolean;
  saving: boolean;
  providers: RegistryProvider[];
  aliasesState: {
    aliases: string[];
    loading: boolean;
    error: string | null;
    setAliases: (next: string[]) => void;
  };
  formActions: {
    onFormDataChange: (next: ModelConfigFormData) => void;
    onAddExtraParam: () => void;
    onRemoveExtraParam: (key: string) => void;
    onUpdateExtraParam: (key: string, value: string) => void;
  };
  onSave: () => void;
  onBack: () => void;
}

interface ModelConfigFormProps {
  controller: ModelConfigController;
}

export function ModelConfigForm({ controller }: ModelConfigFormProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="routing">Routing</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <ModelGeneralTab
            modelName={controller.model?.modelName ?? ""}
            formData={controller.formData}
            onFormDataChange={controller.formActions.onFormDataChange}
          />
        </TabsContent>
        <TabsContent value="routing">
          <ModelRoutingTab
            aliases={controller.aliasesState.aliases}
            loading={controller.aliasesState.loading}
            error={controller.aliasesState.error}
            disabled={controller.saving}
            onChange={controller.aliasesState.setAliases}
          />
        </TabsContent>
        <TabsContent value="advanced">
          <ModelAdvancedTab
            formData={controller.formData}
            providers={controller.providers}
            onFormDataChange={controller.formActions.onFormDataChange}
            onAddExtraParam={controller.formActions.onAddExtraParam}
            onRemoveExtraParam={controller.formActions.onRemoveExtraParam}
            onUpdateExtraParam={controller.formActions.onUpdateExtraParam}
          />
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between border-t pt-4">
        <p className="text-sm text-muted-foreground">
          {controller.isDirty
            ? "You have unsaved changes"
            : "No unsaved changes"}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={controller.onBack}>
            Back
          </Button>
          <Button
            onClick={controller.onSave}
            disabled={
              controller.saving ||
              controller.aliasesState.loading ||
              !controller.isDirty
            }
          >
            {controller.saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
