import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AgentRoutingAliasDialog } from '../components/agent-routing/agent-routing-alias-dialog';
import { AgentRoutingAliasesTab } from '../components/agent-routing/agent-routing-aliases-tab';
import { ModelFormDialog } from '../components/models/model-form-dialog';
import { ModelsTableCard } from '../components/models/models-table-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/tabs';
import { useServerMode } from '../hooks/use-server-mode';
import {
  type AgentRoutingAPIResponse,
  createModel,
  deleteModel,
  getAgentRoutingConfig,
  getAllModels,
  type ModelConfig,
  updateAgentRoutingConfig,
  updateModel,
} from '../lib/api-client';
import { queryKeys } from '../lib/query-keys';
import {
  AGENT_DEFINITIONS,
  CATEGORY_DEFINITIONS,
} from '../types/agent-routing';
import {
  EMPTY_MODEL_FORM_DATA,
  FIXED_KEYS,
  type ModelFormData,
} from './models/model-form-data';

const KNOWN_ALIAS_KEYS = new Set([
  ...AGENT_DEFINITIONS.map((a) => a.key),
  ...CATEGORY_DEFINITIONS.map((c) => c.key),
]);

const KNOWN_ALIAS_PREFIXES = [
  ...AGENT_DEFINITIONS.map((a) => `${a.key}/`),
  ...CATEGORY_DEFINITIONS.map((c) => `${c.key}/`),
];

export function ModelsPage() {
  const queryClient = useQueryClient();
  const { mode, capabilities } = useServerMode();

  const modelsQuery = useQuery({
    queryKey: queryKeys.models,
    queryFn: getAllModels,
  });

  const aliasesQuery = useQuery({
    queryKey: queryKeys.agentRoutingAliases,
    queryFn: getAgentRoutingConfig,
    enabled: capabilities.agentRouting,
  });

  const createModelMutation = useMutation({
    mutationFn: (model: ModelConfig) => createModel(model),
  });

  const updateModelMutation = useMutation({
    mutationFn: (params: {
      modelName: string;
      litellmParams: Record<string, unknown>;
      newName?: string;
    }) => updateModel(params.modelName, params.litellmParams, params.newName),
  });

  const deleteModelMutation = useMutation({
    mutationFn: (modelName: string) => deleteModel(modelName),
  });

  const updateAgentRoutingMutation = useMutation({
    mutationFn: (modelGroupAlias: AgentRoutingAPIResponse) =>
      updateAgentRoutingConfig(modelGroupAlias),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  const [deleteModelName, setDeleteModelName] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [aliasMutationError, setAliasMutationError] = useState<string | null>(
    null,
  );
  const [aliasDialogOpen, setAliasDialogOpen] = useState(false);
  const [aliasDialogMode, setAliasDialogMode] = useState<'add' | 'edit'>('add');
  const [aliasDialogKey, setAliasDialogKey] = useState('');
  const [aliasDialogValue, setAliasDialogValue] = useState('');
  const [formData, setFormData] = useState<ModelFormData>(
    EMPTY_MODEL_FORM_DATA,
  );

  const formLoading =
    createModelMutation.isPending || updateModelMutation.isPending;

  function handleOpenCreate() {
    setEditingModel(null);
    setFormData(EMPTY_MODEL_FORM_DATA);
    setFormError(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(model: ModelConfig) {
    setEditingModel(model);
    const params = model.litellmParams || {};
    const extraParams: Record<string, string> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (!FIXED_KEYS.includes(key)) {
        extraParams[key] = String(value ?? '');
      }
    });

    setFormData({
      modelName: model.modelName,
      apiBase: (params.api_base as string) || '',
      inputCostPerToken: params.input_cost_per_token?.toString() || '',
      outputCostPerToken: params.output_cost_per_token?.toString() || '',
      extraParams,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit() {
    setFormError(null);
    setMutationError(null);

    try {
      if (!formData.modelName.trim()) {
        setFormError('Model name is required');
        return;
      }

      const inputCost = formData.inputCostPerToken
        ? parseFloat(formData.inputCostPerToken)
        : 0;
      const outputCost = formData.outputCostPerToken
        ? parseFloat(formData.outputCostPerToken)
        : 0;

      if (formData.inputCostPerToken && Number.isNaN(inputCost)) {
        setFormError('Input cost must be a valid number');
        return;
      }
      if (formData.outputCostPerToken && Number.isNaN(outputCost)) {
        setFormError('Output cost must be a valid number');
        return;
      }

      const params: Record<string, unknown> = {};
      if (formData.apiBase.trim()) {
        params.api_base = formData.apiBase.trim();
      }
      if (inputCost > 0) {
        params.input_cost_per_token = inputCost;
      }
      if (outputCost > 0) {
        params.output_cost_per_token = outputCost;
      }

      Object.entries(formData.extraParams).forEach(([key, value]) => {
        if (value.trim()) {
          const num = parseFloat(value);
          params[key] = !Number.isNaN(num) ? num : value.trim();
        }
      });

      if (editingModel) {
        const newName =
          mode === 'limited' && formData.modelName !== editingModel.modelName
            ? formData.modelName
            : undefined;

        await updateModelMutation.mutateAsync({
          modelName: editingModel.modelName,
          litellmParams: params,
          newName,
        });
      } else {
        await createModelMutation.mutateAsync({
          modelName: formData.modelName.trim(),
          litellmParams: params,
        });
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.models });
      setDialogOpen(false);
    } catch (e) {
      setFormError(String(e));
    }
  }

  async function handleDelete() {
    if (!deleteModelName) return;

    try {
      setMutationError(null);
      await deleteModelMutation.mutateAsync(deleteModelName);
      await queryClient.invalidateQueries({ queryKey: queryKeys.models });
      setDeleteModelName(null);
    } catch (e) {
      setMutationError(String(e));
    }
  }

  function addExtraParam() {
    setFormData((prev) => ({
      ...prev,
      extraParams: { ...prev.extraParams, [crypto.randomUUID()]: '' },
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

  const customAliases = useMemo(() => {
    if (!aliasesQuery.data) return [];

    return Object.entries(aliasesQuery.data).filter(([key]) => {
      if (KNOWN_ALIAS_KEYS.has(key)) return false;
      return !KNOWN_ALIAS_PREFIXES.some((prefix) => key.startsWith(prefix));
    });
  }, [aliasesQuery.data]);

  function openAddAlias() {
    setAliasDialogMode('add');
    setAliasDialogKey('');
    setAliasDialogValue('');
    setAliasMutationError(null);
    setAliasDialogOpen(true);
  }

  function openEditAlias(key: string, value: string) {
    setAliasDialogMode('edit');
    setAliasDialogKey(key);
    setAliasDialogValue(value);
    setAliasMutationError(null);
    setAliasDialogOpen(true);
  }

  async function handleAliasSave() {
    const key = aliasDialogKey.trim();
    const value = aliasDialogValue.trim();
    if (!key || !value) return;

    try {
      setAliasMutationError(null);
      await updateAgentRoutingMutation.mutateAsync({ [key]: value });

      queryClient.setQueryData<AgentRoutingAPIResponse>(
        queryKeys.agentRoutingAliases,
        (previous) => ({ ...(previous ?? {}), [key]: value }),
      );

      setAliasDialogOpen(false);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.agentRoutingData,
      });
    } catch (e) {
      setAliasMutationError(String(e));
    }
  }

  async function handleAliasDelete(key: string) {
    try {
      setAliasMutationError(null);
      await updateAgentRoutingMutation.mutateAsync({ [key]: '' });

      queryClient.setQueryData<AgentRoutingAPIResponse>(
        queryKeys.agentRoutingAliases,
        (previous) => {
          if (!previous) return previous;

          const next = { ...previous };
          delete next[key];
          return next;
        },
      );

      await queryClient.invalidateQueries({
        queryKey: queryKeys.agentRoutingData,
      });
    } catch (e) {
      setAliasMutationError(String(e));
    }
  }

  const aliasesLoading = aliasesQuery.isPending && !aliasesQuery.data;
  const aliasesError =
    aliasMutationError ||
    (aliasesQuery.error instanceof Error ? aliasesQuery.error.message : null);

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
