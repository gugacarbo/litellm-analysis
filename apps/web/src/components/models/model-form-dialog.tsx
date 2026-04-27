import { Plus, Trash2 } from "lucide-react";
import type { ModelConfig } from "../../lib/api-client";
import type { ModelFormData } from "../../pages/models/model-form-data";
import { Button } from "../button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../dialog";
import { Input } from "../input";

type ModelFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingModel: ModelConfig | null;
  formLoading: boolean;
  formError: string | null;
  formData: ModelFormData;
  onOpenCreate: () => void;
  onFormDataChange: (next: ModelFormData) => void;
  onAddExtraParam: () => void;
  onRemoveExtraParam: (key: string) => void;
  onUpdateExtraParam: (key: string, value: string) => void;
  onSubmit: () => void;
};

export function ModelFormDialog({
  open,
  onOpenChange,
  editingModel,
  formLoading,
  formError,
  formData,
  onOpenCreate,
  onFormDataChange,
  onAddExtraParam,
  onRemoveExtraParam,
  onUpdateExtraParam,
  onSubmit,
}: ModelFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={onOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Model
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {editingModel ? "Edit Model" : "Add New Model"}
          </DialogTitle>
          <DialogDescription>
            {editingModel
              ? `Update configuration for ${editingModel.modelName}`
              : "Configure a new model in LiteLLM"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="model-name" className="text-sm font-medium">
              Model Name
            </label>
            <Input
              id="model-name"
              value={formData.modelName}
              onChange={(e) =>
                onFormDataChange({ ...formData, modelName: e.target.value })
              }
              placeholder="e.g., gpt-4, claude-3-opus"
              disabled={Boolean(editingModel)}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="api-base" className="text-sm font-medium">
              API Base URL
            </label>
            <Input
              id="api-base"
              value={formData.apiBase}
              onChange={(e) =>
                onFormDataChange({ ...formData, apiBase: e.target.value })
              }
              placeholder="https://api.openai.com/v1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="input-cost" className="text-sm font-medium">
                Input Cost
                <span className="text-muted-foreground font-normal ml-1">
                  ($/token)
                </span>
              </label>
              <Input
                id="input-cost"
                type="number"
                step="0.000001"
                min="0"
                value={formData.inputCostPerToken}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    inputCostPerToken: e.target.value,
                  })
                }
                placeholder="0.00"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="output-cost" className="text-sm font-medium">
                Output Cost
                <span className="text-muted-foreground font-normal ml-1">
                  ($/token)
                </span>
              </label>
              <Input
                id="output-cost"
                type="number"
                step="0.000001"
                min="0"
                value={formData.outputCostPerToken}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    outputCostPerToken: e.target.value,
                  })
                }
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="context-window" className="text-sm font-medium">
                Context Window
                <span className="text-muted-foreground font-normal ml-1">
                  (tokens)
                </span>
              </label>
              <Input
                id="context-window"
                type="number"
                step="1"
                min="0"
                value={formData.contextWindowSize}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    contextWindowSize: e.target.value,
                  })
                }
                placeholder="e.g., 200000"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="max-tokens" className="text-sm font-medium">
                Max Output
                <span className="text-muted-foreground font-normal ml-1">
                  (tokens)
                </span>
              </label>
              <Input
                id="max-tokens"
                type="number"
                step="1"
                min="0"
                value={formData.maxTokens}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    maxTokens: e.target.value,
                  })
                }
                placeholder="e.g., 128000"
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
                    onChange={(e) => onUpdateExtraParam(key, e.target.value)}
                    className="font-mono text-sm"
                    placeholder="value"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onRemoveExtraParam(key)}
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
            onClick={onAddExtraParam}
            className="w-fit"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Parameter
          </Button>

          {formError && <p className="text-sm text-destructive">{formError}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={formLoading}>
            {formLoading ? "Saving..." : editingModel ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
