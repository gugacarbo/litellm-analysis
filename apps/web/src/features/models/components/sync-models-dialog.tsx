import { RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type {
  ModelSyncDiffItem,
  SyncDirection,
} from "@/shared/lib/api-client/models";

type SyncModelsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  applying: boolean;
  items: ModelSyncDiffItem[];
  selections: Record<string, SyncDirection>;
  onSelectionChange: (
    modelName: string,
    field: ModelSyncDiffItem["field"],
    direction: SyncDirection,
  ) => void;
  onApply: () => void;
};

function getSelectionKey(item: { modelName: string; field: string }): string {
  return `${item.modelName}::${item.field}`;
}

function formatValue(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

const fieldLabels: Record<ModelSyncDiffItem["field"], string> = {
  model_presence: "Model Presence",
  enabled: "Enabled",
  context_window_size: "Context Window",
  max_tokens: "Max Tokens",
  input_cost_per_token: "Input Cost / token",
  output_cost_per_token: "Output Cost / token",
};

export function SyncModelsDialog({
  open,
  onOpenChange,
  loading,
  applying,
  items,
  selections,
  onSelectionChange,
  onApply,
}: SyncModelsDialogProps) {
  const selectionCount = useMemo(() => items.length, [items.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-5xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Sync Divergences</DialogTitle>
          <DialogDescription>
            Escolha a direção por campo e aplique em lote.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-auto">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Carregando divergências...
            </div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma divergência por campo encontrada.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">Model</th>
                  <th className="p-2">Campo</th>
                  <th className="p-2">Config</th>
                  <th className="p-2">Registry</th>
                  <th className="p-2">Direção</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const key = getSelectionKey(item);
                  const value = selections[key] ?? item.defaultDirection;
                  return (
                    <tr key={key} className="border-b align-top">
                      <td className="p-2 font-medium">{item.modelName}</td>
                      <td className="p-2">{fieldLabels[item.field]}</td>
                      <td className="max-w-xs p-2 font-mono text-xs">
                        {item.field === "model_presence"
                          ? item.configValue == null
                            ? "absent"
                            : "present"
                          : formatValue(item.configValue)}
                      </td>
                      <td className="max-w-xs p-2 font-mono text-xs">
                        {item.field === "model_presence"
                          ? item.registryValue == null
                            ? "absent"
                            : "present"
                          : formatValue(item.registryValue)}
                      </td>
                      <td className="w-56 p-2">
                        <Select
                          value={value}
                          onValueChange={(direction) =>
                            onSelectionChange(
                              item.modelName,
                              item.field,
                              direction as SyncDirection,
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="config-to-registry">
                              config → registry
                            </SelectItem>
                            <SelectItem value="registry-to-config">
                              registry → config
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={onApply}
            disabled={loading || applying || selectionCount === 0}
          >
            <RefreshCw
              className={`mr-1.5 h-3 w-3 ${applying ? "animate-spin" : ""}`}
            />
            Aplicar seleções ({selectionCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
