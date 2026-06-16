import { useModelDetailContext } from "./model-detail-context";
import { useModelConfigPageFromContext } from "../use-model-config-page";
import { ModelConfigForm } from "../components/model-config-form";

export function ModelDetailSettingsTab() {
  const { model, notFound } = useModelDetailContext();
  const {
    formData,
    isDirty,
    saving,
    credentials,
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
      credentials={credentials}
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