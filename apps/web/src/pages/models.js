import { Settings } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AgentRoutingAliasDialog } from "../components/agent-routing/agent-routing-alias-dialog";
import { ModelFormDialog } from "../components/models/model-form-dialog";
import { ModelsTableCard } from "../components/models/models-table-card";
import { PageLayout } from "../components/ui/page-layout";
import { useModelsPage } from "./models/use-models-page";
export function ModelsPage() {
  const {
    aliasDialogKey,
    aliasDialogMode,
    aliasDialogOpen,
    aliasDialogValue,
    deleteModelName,
    dialogOpen,
    editingModel,
    formData,
    formError,
    formLoading,
    modelsQuery,
    mutationError,
    updateAgentRoutingMutation,
    handleAliasSave,
    handleDelete,
    handleOpenCreateWithDefaultCredential,
    handleOpenEdit,
    handleSubmit,
    addExtraParam,
    removeExtraParam,
    setAliasDialogKey,
    setAliasDialogOpen,
    setAliasDialogValue,
    setDeleteModelName,
    setDialogOpen,
    setFormData,
    updateExtraParam,
    credentials,
    defaultCredential,
  } = useModelsPage();
  return _jsxs(PageLayout, {
    title: "Models",
    icon: Settings,
    buttons: _jsx(ModelFormDialog, {
      open: dialogOpen,
      onOpenChange: setDialogOpen,
      editingModel: editingModel,
      formLoading: formLoading,
      formError: formError,
      formData: formData,
      onOpenCreate: () =>
        handleOpenCreateWithDefaultCredential(defaultCredential),
      onFormDataChange: setFormData,
      onAddExtraParam: addExtraParam,
      onRemoveExtraParam: removeExtraParam,
      onUpdateExtraParam: updateExtraParam,
      onSubmit: handleSubmit,
      credentials: credentials,
      defaultCredential: defaultCredential,
    }),
    children: [
      _jsx(ModelsTableCard, {
        models: modelsQuery.data ?? [],
        loading: modelsQuery.isPending && !modelsQuery.data,
        error:
          mutationError ||
          (modelsQuery.error ? String(modelsQuery.error) : null),
        deleteModelName: deleteModelName,
        onDeleteModelNameChange: setDeleteModelName,
        onOpenEdit: handleOpenEdit,
        onDelete: handleDelete,
      }),
      _jsx(AgentRoutingAliasDialog, {
        open: aliasDialogOpen,
        mode: aliasDialogMode,
        saving: updateAgentRoutingMutation.isPending,
        aliasKey: aliasDialogKey,
        aliasValue: aliasDialogValue,
        onOpenChange: setAliasDialogOpen,
        onAliasKeyChange: setAliasDialogKey,
        onAliasValueChange: setAliasDialogValue,
        onSave: handleAliasSave,
      }),
    ],
  });
}
export default ModelsPage;
