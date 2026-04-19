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
import { Textarea } from '../components/textarea';
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

function getInputCost(params: Record<string, unknown>): string {
  return (params?.input_cost_per_token as string) || '-';
}

function getOutputCost(params: Record<string, unknown>): string {
  return (params?.output_cost_per_token as string) || '-';
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
    litellmParams: '{\n  "api_base": "",\n  "input_cost_per_token": 0,\n  "output_cost_per_token": 0\n}',
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

  function handleOpenCreate() {
    setEditingModel(null);
    setFormData({
      modelName: '',
      litellmParams: '{\n  "api_base": "",\n  "input_cost_per_token": 0,\n  "output_cost_per_token": 0\n}',
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(model: ModelConfig) {
    setEditingModel(model);
    setFormData({
      modelName: model.modelName,
      litellmParams: JSON.stringify(model.litellmParams || {}, null, 2),
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit() {
    setFormLoading(true);
    setFormError(null);

    try {
      let params: Record<string, unknown>;
      try {
        params = JSON.parse(formData.litellmParams);
      } catch {
        setFormError('Invalid JSON format');
        setFormLoading(false);
        return;
      }

      if (!formData.modelName.trim()) {
        setFormError('Model name is required');
        setFormLoading(false);
        return;
      }

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
                <label htmlFor="litellm-params" className="text-sm font-medium">
                  LiteLLM Parameters (JSON)
                </label>
                <Textarea
                  id="litellm-params"
                  value={formData.litellmParams}
                  onChange={(e) =>
                    setFormData({ ...formData, litellmParams: e.target.value })
                  }
                  placeholder='{"api_base": "", "input_cost_per_token": 0}'
                  className="font-mono text-sm min-h-[200px]"
                />
                {formError && (
                  <p className="text-sm text-destructive">{formError}</p>
                )}
              </div>
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
                  <TableHead className="text-right">Input Cost</TableHead>
                  <TableHead className="text-right">Output Cost</TableHead>
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