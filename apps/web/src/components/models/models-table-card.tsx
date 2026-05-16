import { Database, Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { ModelWithStatus } from "../../lib/api-client/models";
import {
  getContextWindow,
  getHealthStatusLabel,
  getInputCost,
  getMaxOutput,
  getOutputCost,
  type ModelHealthEntry,
} from "../../pages/models/models-utils";
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
} from "../ui/alert-dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Switch } from "../ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

const statusBadgeVariant: Record<
  string,
  "default" | "secondary" | "outline" | "success"
> = {
  synced: "success",
  "config-only": "secondary",
  "litellm-only": "outline",
};

const statusLabel: Record<string, string> = {
  synced: "Synced",
  "config-only": "Config Only",
  "litellm-only": "LiteLLM Only",
};

type ModelsTableCardProps = {
  models: ModelWithStatus[];
  loading: boolean;
  error: string | null;
  deleteModelName: string | null;
  modelsHealth?: ModelHealthEntry[];
  addToConfigPending: boolean;
  onDeleteModelNameChange: (value: string | null) => void;
  onDelete: () => void;
  onAddToConfig: (modelName: string) => void;
  onToggleEnabled: (modelName: string, enabled: boolean) => void;
};

const statusConfig: Record<
  string,
  {
    variant: "default" | "secondary" | "destructive" | "outline" | "success";
  }
> = {
  healthy: { variant: "success" },
  degraded: { variant: "secondary" },
  offline: { variant: "destructive" },
  unknown: { variant: "outline" },
};

export function ModelsTableCard({
  models,
  loading,
  error,
  deleteModelName,
  modelsHealth = [],
  addToConfigPending,
  onDeleteModelNameChange,
  onDelete,
  onAddToConfig,
  onToggleEnabled,
}: ModelsTableCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Configured Models
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="p-4 text-destructive">Error: {error}</div>}

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
                <TableHead>Enabled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Health</TableHead>
                <TableHead className="text-right">Context</TableHead>
                <TableHead className="text-right">Max Output</TableHead>
                <TableHead className="text-right">Input ($/Mi)</TableHead>
                <TableHead className="text-right">Output ($/Mi)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => {
                const health = modelsHealth.find(
                  (h) => h.model === model.modelName,
                );
                const inLiteLLM =
                  model.status === "synced" || model.status === "litellm-only";

                return (
                  <TableRow
                    key={model.modelName}
                    className={
                      model.enabled === false ? "opacity-50" : undefined
                    }
                  >
                    <TableCell className="font-medium">
                      <Link
                        to={`/models/${encodeURIComponent(model.modelName)}`}
                        className="hover:underline"
                      >
                        {model.modelName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={model.enabled !== false}
                        onCheckedChange={(checked) =>
                          onToggleEnabled(model.modelName, checked)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell>
                      {model.enabled === false ? (
                        <Badge variant="destructive">Disabled</Badge>
                      ) : (
                        <Badge
                          variant={
                            statusBadgeVariant[model.status] ?? "outline"
                          }
                        >
                          {statusLabel[model.status] ?? model.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {inLiteLLM ? (
                        <Badge
                          variant={
                            statusConfig[health?.status ?? "healthy"]
                              ?.variant ?? "outline"
                          }
                        >
                          {getHealthStatusLabel(health?.status ?? "healthy")}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {getContextWindow(model.litellmParams)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getMaxOutput(model.litellmParams)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getInputCost(model.litellmParams)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getOutputCost(model.litellmParams)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {inLiteLLM ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              asChild
                            >
                              <Link
                                to={`/models/${encodeURIComponent(model.modelName)}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() =>
                                    onDeleteModelNameChange(model.modelName)
                                  }
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
                                    Are you sure you want to delete{" "}
                                    <span className="font-semibold">
                                      {deleteModelName}
                                    </span>
                                    ? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel
                                    onClick={() =>
                                      onDeleteModelNameChange(null)
                                    }
                                  >
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={onDelete}
                                    >
                                      Delete
                                    </Button>
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                        {model.status === "litellm-only" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            disabled={addToConfigPending}
                            onClick={() => onAddToConfig(model.modelName)}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add to Config
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
