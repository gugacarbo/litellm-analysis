import { Settings } from "lucide-react";
import { ModelFormDialog } from "../components/models/model-form-dialog";
import { ModelsTableCard } from "../components/models/models-table-card";
import { PageLayout } from "../components/ui/page-layout";
import { useModelsPage } from "./models/use-models-page";

export function ModelsPage() {
  const {
    deleteModelName,
    setDeleteModelName,
    dialogOpen,
    editingModel,
    formData,
    formError,
    formLoading,
    modelsQuery,
    modelsHealth,
    mutationError,
    handleDelete,
    handleOpenCreateWithDefaultCredential,
    handleOpenEdit,
    handleSubmit,
    addExtraParam,
    removeExtraParam,
    setDialogOpen,
    setFormData,
    updateExtraParam,
    credentials,
    defaultCredential,
  } = useModelsPage();

  return (
    <PageLayout
      title="Models"
      icon={Settings}
      buttons={
        <ModelFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editingModel={editingModel}
          formLoading={formLoading}
          formError={formError}
          formData={formData}
          onOpenCreate={() =>
            handleOpenCreateWithDefaultCredential(defaultCredential)
          }
          onFormDataChange={setFormData}
          onAddExtraParam={addExtraParam}
          onRemoveExtraParam={removeExtraParam}
          onUpdateExtraParam={updateExtraParam}
          onSubmit={handleSubmit}
          credentials={credentials}
          defaultCredential={defaultCredential}
        />
      }
    >
      <ModelsTableCard
        models={modelsQuery.data ?? []}
        loading={modelsQuery.isPending && !modelsQuery.data}
        modelsHealth={modelsHealth}
        error={
          mutationError ||
          (modelsQuery.error ? String(modelsQuery.error) : null)
        }
        deleteModelName={deleteModelName}
        onDeleteModelNameChange={setDeleteModelName}
        onOpenEdit={handleOpenEdit}
        onDelete={handleDelete}
      />
    </PageLayout>
  );
}
