import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Settings, Database } from 'lucide-react';
import { Button } from '../components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/table';
import { Input } from '../components/input';
import { Skeleton } from '../components/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/alert-dialog';
import {
  getAllModels,
  createModel,
  updateModel,
  deleteModel,
  type ModelConfig,
} from '../lib/api-client';

function getApiBase(params: Record<string, unknown>): string {
  return (params?.api_base as string) || '-';
}

function formatCost(value: unknown): string {
  if (value === null || value === undefined) return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return '-';
  return `$${(num * 1_000_000).toFixed(2)}/Mi`;
}

function getInputCost(params: Record<string, unknown>): string {
  return formatCost(params?.input_cost_per_token);
}

function getOutputCost(params: Record<string, unknown>): string {
  return formatCost(params?.output_cost_per_token);
}

export function ModelsPage() {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  const [deleteModelName, setDeleteModelName] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    modelName: '',
    apiBase: '',
    inputCostPerToken: '',
    outputCostPerToken: '',
    extraParams: {} as Record<string, string>,
  });

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

  const FIXED_KEYS = ['api_base', 'input_cost_per_token', 'output_cost_per_token'];

  function handleOpenCreate() {
    setEditingModel(null);
    setFormData({
      modelName: '',
      apiBase: '',
      inputCostPerToken: '',
      outputCostPerToken: '',
      extraParams: {},
    });
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
        await updateModel(editingModel.modelName, params);
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Model
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingModel ? 'Edit Model' : 'Add New Model'}
              </DialogTitle>
              <DialogDescription>
                {editingModel
                  ? `Update configuration for ${editingModel.modelName}`
                  : 'Configure a new model in LiteLLM'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="model-name" className="text-sm font-medium">Model Name</label>
                <Input
                  id="model-name"
                  value={formData.modelName}
                  onChange={(e) =>
                    setFormData({ ...formData, modelName: e.target.value })
                  }
                  placeholder="e.g., gpt-4, claude-3-opus"
                  disabled={!!editingModel}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="api-base" className="text-sm font-medium">API Base URL</label>
                <Input
                  id="api-base"
                  value={formData.apiBase}
                  onChange={(e) =>
                    setFormData({ ...formData, apiBase: e.target.value })
                  }
                  placeholder="https://api.openai.com/v1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="input-cost" className="text-sm font-medium">
                    Input Cost
                    <span className="text-muted-foreground font-normal ml-1">($/token)</span>
                  </label>
                  <Input
                    id="input-cost"
                    type="number"
                    step="0.000001"
                    min="0"
                    value={formData.inputCostPerToken}
                    onChange={(e) =>
                      setFormData({ ...formData, inputCostPerToken: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="output-cost" className="text-sm font-medium">
                    Output Cost
                    <span className="text-muted-foreground font-normal ml-1">($/token)</span>
                  </label>
                  <Input
                    id="output-cost"
                    type="number"
                    step="0.000001"
                    min="0"
                    value={formData.outputCostPerToken}
                    onChange={(e) =>
                      setFormData({ ...formData, outputCostPerToken: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              {Object.keys(formData.extraParams).length > 0 && (
                <div className="grid gap-3">
                  <span className="text-sm font-medium">Additional Parameters</span>
                  {Object.entries(formData.extraParams).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Input
                        value={key}
                        disabled
                        className="bg-muted font-mono text-sm"
                        placeholder="param_name"
                      />
                      <Input
                        value={value}
                        onChange={(e) => updateExtraParam(key, e.target.value)}
                        className="font-mono text-sm"
                        placeholder="value"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeExtraParam(key)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addExtraParam}
                className="w-fit"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Parameter
              </Button>

              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={formLoading}>
                {formLoading ? 'Saving...' : editingModel ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Configured Models
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-4 text-destructive">Error: {error}</div>
          )}
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : models.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No models configured. Add your first model to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model Name</TableHead>
                  <TableHead>API Base</TableHead>
                  <TableHead className="text-right">Input ($/Mi)</TableHead>
                  <TableHead className="text-right">Output ($/Mi)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <TableRow key={model.modelName}>
                    <TableCell className="font-medium">
                      {model.modelName}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {getApiBase(model.litellmParams)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getInputCost(model.litellmParams)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getOutputCost(model.litellmParams)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenEdit(model)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setDeleteModelName(model.modelName)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Model
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete{' '}
                                <span className="font-semibold">
                                  {deleteModelName}
                                </span>
                                ? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                onClick={() => setDeleteModelName(null)}
                              >
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction asChild>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={handleDelete}
                                >
                                  Delete
                                </Button>
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ModelsPage;