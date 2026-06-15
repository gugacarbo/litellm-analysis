import { Database, Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  getContextWindow,
  getInputCost,
  getMaxOutput,
  getOutputCost,
} from "@/features/models/models-utils";
import { StatusBadge } from "@/features/monitor/components/status-badge";
import type { HealthCheckResultEntry } from "@/features/monitor/types/health-status-types";
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
} from "@/shared/components/ui/alert-dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Switch } from "@/shared/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import type { ModelWithStatus } from "@/shared/lib/api-client/models";

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
  healthChecksByModel: Map<string, HealthCheckResultEntry>;
  getHealthCheck: (modelName: string) => HealthCheckResultEntry | undefined;
  healthChecksLoading?: boolean;
  addToConfigPending: boolean;
  onDeleteModelNameChange: (value: string | null) => void;
  onDelete: () => void;
  onAddToConfig: (modelName: string) => void;
  onToggleEnabled: (modelName: string, enabled: boolean) => void;
};

export function ModelsTableCard({
  models,
  loading,
  error,
  deleteModelName,
  healthChecksByModel,
  getHealthCheck,
  healthChecksLoading = false,
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
                const health = getHealthCheck(model.modelName);
                const inLiteLLM =
                  model.status === "synced" || model.status === "litellm-only";
                const inConfig = model.status !== "litellm-only";

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
                        healthChecksLoading &&
                        !healthChecksByModel.has(model.modelName) ? (
                          <Skeleton className="h-5 w-24" />
                        ) : (
                          <StatusBadge status={health?.status ?? "unknown"} />
                        )
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
                            <Button variant="ghost" size="icon-sm" asChild>
                              <Link
                                to={`/models/${encodeURIComponent(model.modelName)}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            {inConfig ? (
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
                                      Remove From Config
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Isso remove{" "}
                                      <span className="font-semibold">
                                        {deleteModelName}
                                      </span>{" "}
                                      apenas da config local. A remoção no
                                      LiteLLM DB é feita pelo fluxo de Sync.
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
                                        Remover
                                      </Button>
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : null}
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
