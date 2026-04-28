import { useState } from "react";
import type { ModelConfig } from "../../lib/api-client";
import { EMPTY_MODEL_FORM_DATA, type ModelFormData } from "./model-form-data";
import { mapModelToFormData } from "./models-form-utils";

export function useModelsFormState() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  const [deleteModelName, setDeleteModelName] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ModelFormData>(
    EMPTY_MODEL_FORM_DATA,
  );

  function handleOpenCreate() {
    setEditingModel(null);
    setFormData(EMPTY_MODEL_FORM_DATA);
    setFormError(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(model: ModelConfig) {
    setEditingModel(model);
    setFormData(mapModelToFormData(model));
    setFormError(null);
    setDialogOpen(true);
  }

  function addExtraParam() {
    setFormData((prev) => ({
      ...prev,
      extraParams: {
        ...prev.extraParams,
        [crypto.randomUUID()]: "",
      },
    }));
  }

  function removeExtraParam(key: string) {
    setFormData((prev) => {
      const next = { ...prev.extraParams };
      delete next[key];
      return { ...prev, extraParams: next };
    });
  }

  function updateExtraParam(key: string, value: string) {
    setFormData((prev) => ({
      ...prev,
      extraParams: { ...prev.extraParams, [key]: value },
    }));
  }

  return {
    deleteModelName,
    dialogOpen,
    editingModel,
    formData,
    formError,
    handleOpenCreate,
    handleOpenEdit,
    addExtraParam,
    removeExtraParam,
    updateExtraParam,
    setDeleteModelName,
    setDialogOpen,
    setFormData,
  };
}
