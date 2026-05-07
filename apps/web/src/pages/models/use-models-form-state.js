import { useState } from "react";
import { EMPTY_MODEL_FORM_DATA } from "./model-form-data";
import { mapModelToFormData } from "./models-form-utils";
export function useModelsFormState() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [deleteModelName, setDeleteModelName] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState(EMPTY_MODEL_FORM_DATA);
  function handleOpenCreate() {
    setEditingModel(null);
    setFormData(EMPTY_MODEL_FORM_DATA);
    setFormError(null);
    setDialogOpen(true);
  }
  function handleOpenCreateWithDefaultCredential(defaultCredential) {
    setEditingModel(null);
    setFormData({
      ...EMPTY_MODEL_FORM_DATA,
      litellmCredentialName: defaultCredential || "",
    });
    setFormError(null);
    setDialogOpen(true);
  }
  function handleOpenEdit(model) {
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
  function removeExtraParam(key) {
    setFormData((prev) => {
      const next = { ...prev.extraParams };
      delete next[key];
      return { ...prev, extraParams: next };
    });
  }
  function updateExtraParam(key, value) {
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
    handleOpenCreateWithDefaultCredential,
    handleOpenEdit,
    addExtraParam,
    removeExtraParam,
    updateExtraParam,
    setDeleteModelName,
    setDialogOpen,
    setFormData,
    setFormError,
  };
}
