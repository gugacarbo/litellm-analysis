import type { ReactNode } from "react";
import type { ModelConfigFormData } from "@/features/models/use-model-config-page";
import { Button } from "@/shared/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import type { ModelWithStatus } from "@/shared/lib/api-client/models";
import type { RegistryProvider } from "@/shared/lib/api-client/providers";
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
  headerAction?: ReactNode;
}

export function ModelConfigForm({
  controller,
  headerAction,
}: ModelConfigFormProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="routing">Routing</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div>{headerAction}</div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {controller.isDirty
                ? "You have unsaved changes"
                : "No unsaved changes"}
            </p>
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
    </div>
  );
}
