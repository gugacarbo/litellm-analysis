import { Settings } from "lucide-react";
import { AgentRoutingAliasDialog } from "../components/agent-routing/agent-routing-alias-dialog";
import { AgentRoutingAliasesTab } from "../components/agent-routing/agent-routing-aliases-tab";
import { ModelFormDialog } from "../components/models/model-form-dialog";
import { ModelsTableCard } from "../components/models/models-table-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/tabs";
import { useModelsPage } from "./models/use-models-page";

export function ModelsPage() {
  const {
    aliasesError,
    aliasesLoading,
    aliasDialogKey,
    aliasDialogMode,
    aliasDialogOpen,
    aliasDialogValue,
    capabilities,
    customAliases,
    deleteModelName,
    dialogOpen,
    editingModel,
    formData,
    formError,
    formLoading,
    mode,
    modelsQuery,
    mutationError,
    updateAgentRoutingMutation,
    handleAliasDelete,
    handleAliasSave,
    handleDelete,
    handleOpenCreate,
    handleOpenEdit,
    handleSubmit,
    openAddAlias,
    openEditAlias,
    addExtraParam,
    removeExtraParam,
    setAliasDialogKey,
    setAliasDialogOpen,
    setAliasDialogValue,
    setDeleteModelName,
    setDialogOpen,
    setFormData,
    updateExtraParam,
  } = useModelsPage();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Models
        </h1>
        <ModelFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editingModel={editingModel}
          mode={mode}
          formLoading={formLoading}
          formError={formError}
          formData={formData}
          onOpenCreate={handleOpenCreate}
          onFormDataChange={setFormData}
          onAddExtraParam={addExtraParam}
          onRemoveExtraParam={removeExtraParam}
          onUpdateExtraParam={updateExtraParam}
          onSubmit={handleSubmit}
        />
      </div>

      <Tabs defaultValue="models">
        <TabsList>
          <TabsTrigger value="models">Models</TabsTrigger>
          {capabilities.agentRouting ? (
            <TabsTrigger value="aliases">Custom Aliases</TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="models" className="mt-4">
          <ModelsTableCard
            models={modelsQuery.data ?? []}
            loading={modelsQuery.isPending && !modelsQuery.data}
            error={
              mutationError ||
              (modelsQuery.error ? String(modelsQuery.error) : null)
            }
            deleteModelName={deleteModelName}
            onDeleteModelNameChange={setDeleteModelName}
            onOpenEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
        </TabsContent>

        {capabilities.agentRouting ? (
          <TabsContent value="aliases" className="mt-4">
            <AgentRoutingAliasesTab
              loading={aliasesLoading}
              saving={updateAgentRoutingMutation.isPending}
              error={aliasesError}
              customAliases={customAliases}
              onOpenAddAlias={openAddAlias}
              onOpenEditAlias={openEditAlias}
              onDeleteAlias={handleAliasDelete}
            />
          </TabsContent>
        ) : null}
      </Tabs>

      <AgentRoutingAliasDialog
        open={aliasDialogOpen}
        mode={aliasDialogMode}
        saving={updateAgentRoutingMutation.isPending}
        aliasKey={aliasDialogKey}
        aliasValue={aliasDialogValue}
        onOpenChange={setAliasDialogOpen}
        onAliasKeyChange={setAliasDialogKey}
        onAliasValueChange={setAliasDialogValue}
        onSave={handleAliasSave}
      />
    </div>
  );
}

export default ModelsPage;
