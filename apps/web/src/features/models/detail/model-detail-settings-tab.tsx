import { ModelConfigForm } from "../components/model-config-form";
import { useModelConfigPageFromContext } from "../use-model-config-page";
import { useModelDetailContext } from "./model-detail-context";

export function ModelDetailSettingsTab() {
  const { model, notFound } = useModelDetailContext();
  const {
    formData,
    isDirty,
    saving,
    providers,
    onFormDataChange,
    onAddExtraParam,
    onRemoveExtraParam,
    onUpdateExtraParam,
    onSave,
    onBack,
  } = useModelConfigPageFromContext();

  if (notFound || !model) {
    return null;
  }

  return (
    <ModelConfigForm
      modelName={model.modelName}
      formData={formData}
      providers={providers}
      onFormDataChange={onFormDataChange}
      onAddExtraParam={onAddExtraParam}
      onRemoveExtraParam={onRemoveExtraParam}
      onUpdateExtraParam={onUpdateExtraParam}
      onSave={onSave}
      onBack={onBack}
      saving={saving}
      isDirty={isDirty}
    />
  );
}
