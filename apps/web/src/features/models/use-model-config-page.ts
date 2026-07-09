import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { ModelWithStatus } from "@/shared/lib/api-client/models";
import type { RegistryProvider } from "@/shared/lib/api-client/providers";
import { useModelDetailContext } from "./detail/model-detail-context";
import {
  type UseModelAliasesResult,
  useModelAliases,
} from "./hooks/use-model-aliases";
import {
  type ModelConfigFormData,
  modelToFormData,
  type UseModelConfigFormResult,
  useModelConfigForm,
} from "./hooks/use-model-config-form";
import { useModelConfigSave } from "./hooks/use-model-config-save";

export type { ModelConfigFormData };

export interface ModelConfigController {
  model: ModelWithStatus | null;
  formData: ModelConfigFormData;
  isDirty: boolean;
  saving: boolean;
  providers: RegistryProvider[];
  aliasesState: UseModelAliasesResult;
  formActions: Pick<
    UseModelConfigFormResult,
    | "onFormDataChange"
    | "onAddExtraParam"
    | "onRemoveExtraParam"
    | "onUpdateExtraParam"
  >;
  onSave: () => void;
  onBack: () => void;
}

export function useModelConfigPage(): ModelConfigController {
  const { model, providers } = useModelDetailContext();
  const modelName = model?.modelName ?? "";
  const formHook = useModelConfigForm();
  const aliasesState = useModelAliases(modelName);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const onSaved = useCallback(
    (savedModel: ModelWithStatus | null) => {
      formHook.commitSavedFormData(
        savedModel ? modelToFormData(savedModel) : formHook.formData,
      );
      aliasesState.commitSavedAliases(aliasesState.normalizedAliases);
    },
    [
      formHook.commitSavedFormData,
      formHook.formData,
      aliasesState.normalizedAliases,
      aliasesState.commitSavedAliases,
    ],
  );

  const { saving, save } = useModelConfigSave({
    model,
    formData: formHook.formData,
    aliasesState,
    queryClient,
    onSaved,
  });

  const isDirty = formHook.isDirty || aliasesState.isDirty;
  const onBack = useCallback(() => navigate(-1), [navigate]);

  const previousModelNameRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      previousModelNameRef.current !== null &&
      previousModelNameRef.current === modelName
    ) {
      return;
    }
    previousModelNameRef.current = modelName;
    formHook.resetFormForModel(model);
    aliasesState.resetForModel(modelName);
  }, [
    modelName,
    model,
    formHook.resetFormForModel,
    aliasesState.resetForModel,
  ]);

  return {
    model,
    formData: formHook.formData,
    isDirty,
    saving,
    providers,
    aliasesState,
    formActions: {
      onFormDataChange: formHook.onFormDataChange,
      onAddExtraParam: formHook.onAddExtraParam,
      onRemoveExtraParam: formHook.onRemoveExtraParam,
      onUpdateExtraParam: formHook.onUpdateExtraParam,
    },
    onSave: save,
    onBack,
  };
}

export function useModelConfigPageFromContext(): ModelConfigController &
  Pick<
    UseModelConfigFormResult,
    | "onFormDataChange"
    | "onAddExtraParam"
    | "onRemoveExtraParam"
    | "onUpdateExtraParam"
  > {
  const controller = useModelConfigPage();
  return {
    ...controller,
    ...controller.formActions,
  };
}
