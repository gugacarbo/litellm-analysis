import { Settings } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ModelFormDialog } from '../components/models/model-form-dialog';
import { ModelsTableCard } from '../components/models/models-table-card';
import { useServerMode } from '../hooks/use-server-mode';
import {
  createModel,
  deleteModel,
  getAllModels,
  type ModelConfig,
  updateModel,
} from '../lib/api-client';
import {
  EMPTY_MODEL_FORM_DATA,
  FIXED_KEYS,
  type ModelFormData,
} from './models/model-form-data';

export function ModelsPage() {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  const [deleteModelName, setDeleteModelName] = useState<string | null>(null);
  const { mode } = useServerMode();
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ModelFormData>(
    EMPTY_MODEL_FORM_DATA,
  );

  const loadModels = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllModels();
      setModels(data);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

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
    setFormLoading(true);
    setFormError(null);

    try {
      if (!formData.modelName.trim()) {
        setFormError('Model name is required');
        setFormLoading(false);
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
        setFormLoading(false);
        return;
      }
      if (formData.outputCostPerToken && Number.isNaN(outputCost)) {
        setFormError('Output cost must be a valid number');
        setFormLoading(false);
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
        await updateModel(editingModel.modelName, params, newName);
      } else {
        await createModel({
          modelName: formData.modelName.trim(),
          litellmParams: params,
        });
      }

      setDialogOpen(false);
      await loadModels();
    } catch (e) {
      setFormError(String(e));
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteModelName) return;

    try {
      await deleteModel(deleteModelName);
      setDeleteModelName(null);
      await loadModels();
    } catch (e) {
      setError(String(e));
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

      <ModelsTableCard
        models={models}
        loading={loading}
        error={error}
        deleteModelName={deleteModelName}
        onDeleteModelNameChange={setDeleteModelName}
        onOpenEdit={handleOpenEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default ModelsPage;
