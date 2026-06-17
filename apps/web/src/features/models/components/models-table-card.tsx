import {
  Activity,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleX,
  Database,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ModelFormDialog } from "@/features/models/components/model-form-dialog";
import { SyncModelsDialog } from "@/features/models/components/sync-models-dialog";
import {
  getContextWindow,
  getInputCost,
  getMaxOutput,
  getOutputCost,
} from "@/features/models/models-utils";
import { StatusBadge } from "@/features/monitor/components/status-badge";
import type { HealthCheckResultEntry } from "@/features/monitor/types/health-status-types";
import {
  formatRelativeTime,
  formatResponseTime,
  formatTimestamp,
  formatTokensPerSecond,
  STATUS_COLORS,
} from "@/features/monitor/utils/health-status-utils";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
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
import type { RegistryCredential } from "@/shared/lib/api-client/credentials";
import type {
  ModelConfig,
  ModelSyncDiffItem,
  ModelWithStatus,
  SyncDirection,
  SyncField,
} from "@/shared/lib/api-client/models";
import { resolveModelRoute } from "@/shared/lib/api-client/models";

const statusBadgeVariant: Record<
  string,
  "default" | "secondary" | "outline" | "success"
> = {
  synced: "success",
  "config-only": "secondary",
  "registry-only": "outline",
};

const statusLabel: Record<string, string> = {
  synced: "Synced",
  "config-only": "Config Only",
  "registry-only": "Registry Only",
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

  // sync + form + credentials
  counts: { configOnly: number; registryOnly: number };
  syncing: boolean;
  syncDialogOpen: boolean;
  setSyncDialogOpen: (open: boolean) => void;
  syncDiffItems: ModelSyncDiffItem[];
  syncDiffLoading: boolean;
  syncSelections: Record<string, SyncDirection>;
  onSyncSelectionChange: (
    modelName: string,
    field: SyncField,
    direction: SyncDirection,
  ) => void;
  onApplySync: () => void;
  onOpenSync: () => void;

  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  editingModel: ModelConfig | null;
  formLoading: boolean;
  formError: string | null;
  formData: import("@/features/models/model-form-data").ModelFormData;
  onOpenCreate: () => void;
  onFormDataChange: (
    next: import("@/features/models/model-form-data").ModelFormData,
  ) => void;
  onAddExtraParam: () => void;
  onRemoveExtraParam: (key: string) => void;
  onUpdateExtraParam: (key: string, value: string) => void;
  onSubmit: () => void;

  credentials: RegistryCredential[];
  defaultCredential: string | null;
  providerLoading: boolean;
  providerSaving: boolean;
  providerDefaultCredential: string | null;
  onProviderDefaultCredentialChange: (value: string) => void;
  defaultSettingsDriftCount: number;
  defaultSettingsMismatchedModels: string[];
  defaultSettingsLoading: boolean;
  syncingDefaultSettings: boolean;
  onSyncDefaultSettings: () => void;
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
  counts,
  syncing,
  syncDialogOpen,
  setSyncDialogOpen,
  syncDiffItems,
  syncDiffLoading,
  syncSelections,
  onSyncSelectionChange,
  onApplySync,
  onOpenSync,
  dialogOpen,
  setDialogOpen,
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
  credentials,
  defaultCredential,
  providerLoading,
  providerSaving,
  providerDefaultCredential,
  onProviderDefaultCredentialChange,
  defaultSettingsDriftCount,
  defaultSettingsMismatchedModels,
  defaultSettingsLoading,
  syncingDefaultSettings,
  onSyncDefaultSettings,
}: ModelsTableCardProps) {
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [page, setPage] = useState(1);

  const pageSize = models.length || 1;
  const totalPages = Math.ceil(models.length / pageSize) || 1;
  const start = models.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, models.length);
  const pageModels = useMemo(
    () => models.slice((page - 1) * pageSize, page * pageSize),
    [models, page, pageSize],
  );

  const total = models.length;
  const enabledCount = models.filter((m) => m.enabled !== false).length;
  const syncedCount = models.filter((m) => m.status === "synced").length;
  const healthyCount = models.filter(
    (m) =>
      (m.status === "synced" || m.status === "registry-only") &&
      getHealthCheck(m.modelName)?.status === "healthy",
  ).length;
  const driftCount = counts.configOnly + defaultSettingsDriftCount;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5">
            <Database className="size-3.5 text-muted-foreground" />
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Models
            </span>
            <span className="text-sm font-semibold tabular-nums">{total}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5">
            <Activity
              className="size-3.5"
              style={{ color: STATUS_COLORS.healthy }}
            />
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Enabled
            </span>
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: STATUS_COLORS.healthy }}
            >
              {enabledCount}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5">
            <CircleCheck
              className="size-3.5"
              style={{ color: STATUS_COLORS.healthy }}
            />
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Synced
            </span>
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: STATUS_COLORS.healthy }}
            >
              {syncedCount}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5">
            <CircleX
              className="size-3.5"
              style={{ color: STATUS_COLORS.unhealthy }}
            />
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Drift
            </span>
            <span
              className="text-sm font-semibold tabular-nums"
              style={{
                color: driftCount > 0 ? STATUS_COLORS.unhealthy : undefined,
              }}
            >
              {driftCount}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5">
            <CircleAlert
              className="size-3.5"
              style={{ color: STATUS_COLORS.error }}
            />
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Unhealthy
            </span>
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: STATUS_COLORS.error }}
            >
              {total - healthyCount}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => {
              void onOpenSync();
            }}
            disabled={syncing}
          >
            <RefreshCw
              className={`mr-1.5 h-3 w-3 ${syncing ? "animate-spin" : ""}`}
            />
            Sync
            {driftCount > 0 ? ` (${driftCount})` : null}
          </Button>

          <Dialog
            open={credentialsDialogOpen}
            onOpenChange={setCredentialsDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                Credentials
                {defaultSettingsDriftCount > 0
                  ? ` (${defaultSettingsDriftCount})`
                  : null}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Credentials</DialogTitle>
                <DialogDescription>
                  Defina a credencial padrão e sincronize os modelos fora do
                  padrão.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Default credential</p>
                  <Select
                    value={providerDefaultCredential || "none"}
                    onValueChange={(value) => {
                      void onProviderDefaultCredentialChange(
                        value === "none" ? "" : value,
                      );
                    }}
                    disabled={providerLoading || providerSaving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Default credential" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        Sem credencial padrão
                      </SelectItem>
                      {credentials.map((credential) => (
                        <SelectItem
                          key={credential.credentialId}
                          value={credential.credentialName}
                        >
                          {credential.credentialName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Modelos fora da credencial padrão
                  </p>
                  {defaultSettingsLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Carregando...
                    </p>
                  ) : defaultSettingsMismatchedModels.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Todos os modelos já estão com a credencial padrão.
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-auto rounded-md border p-2">
                      <ul className="space-y-1 text-sm">
                        {defaultSettingsMismatchedModels.map((modelName) => (
                          <li key={modelName} className="font-mono">
                            {modelName}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCredentialsDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    void onSyncDefaultSettings();
                  }}
                  disabled={
                    syncingDefaultSettings || defaultSettingsDriftCount === 0
                  }
                >
                  <RefreshCw
                    className={`mr-1.5 h-3 w-3 ${
                      syncingDefaultSettings ? "animate-spin" : ""
                    }`}
                  />
                  Sync default settings
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <ModelFormDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            editingModel={editingModel}
            formLoading={formLoading}
            formError={formError}
            formData={formData}
            onOpenCreate={onOpenCreate}
            onFormDataChange={onFormDataChange}
            onAddExtraParam={onAddExtraParam}
            onRemoveExtraParam={onRemoveExtraParam}
            onUpdateExtraParam={onUpdateExtraParam}
            onSubmit={onSubmit}
            credentials={credentials}
            defaultCredential={defaultCredential}
          />
        </div>
      </div>

      <div className="rounded-lg border">
        {error && (
          <div className="p-4 text-sm text-destructive">Error: {error}</div>
        )}

        {loading ? (
          <div className="space-y-2 p-4">
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
                <TableHead className="w-42.5">Latency / HTTP</TableHead>
                <TableHead className="w-30">TTFT</TableHead>
                <TableHead className="w-25">Tokens/s</TableHead>
                <TableHead className="w-25">Source</TableHead>
                <TableHead className="w-30">When</TableHead>
                <TableHead className="text-right">Context</TableHead>
                <TableHead className="text-right">Max Output</TableHead>
                <TableHead className="text-right">Input ($/Mi)</TableHead>
                <TableHead className="text-right">Output ($/Mi)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageModels.map((model) => {
                const health = getHealthCheck(model.modelName);
                const routeParams = resolveModelRoute(model);
                const inRegistry =
                  model.status === "synced" || model.status === "registry-only";
                const inConfig = model.status !== "registry-only";

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
                      {inRegistry ? (
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
                    <TableCell>
                      {inRegistry ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-mono text-xs tabular-nums">
                            {formatResponseTime(health?.responseTimeMs ?? null)}
                          </span>
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {health?.statusCode ?? "—"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {inRegistry
                        ? formatResponseTime(health?.ttftMs ?? null)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {inRegistry
                        ? formatTokensPerSecond(health?.tokensPerSecond ?? null)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {health?.source ?? "—"}
                    </TableCell>
                    <TableCell
                      className="text-xs text-muted-foreground"
                      title={
                        health?.checkedAt
                          ? formatTimestamp(health.checkedAt)
                          : ""
                      }
                    >
                      {health?.checkedAt
                        ? formatRelativeTime(health.checkedAt)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {getContextWindow(routeParams)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getMaxOutput(routeParams)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getInputCost(routeParams)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getOutputCost(routeParams)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {inRegistry ? (
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
                                      registry é feita pelo fluxo de Sync.
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
                        {model.status === "registry-only" ? (
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

        {models.length > 0 && (
          <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-2">
            <span className="text-xs text-muted-foreground tabular-nums">
              Showing {start}–{end} of {models.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-3.5" />
                Prev
              </Button>
              <span className="px-1 text-xs tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <SyncModelsDialog
        open={syncDialogOpen}
        onOpenChange={setSyncDialogOpen}
        loading={syncDiffLoading}
        applying={syncing}
        items={syncDiffItems}
        selections={syncSelections}
        onSelectionChange={onSyncSelectionChange}
        onApply={onApplySync}
      />
    </div>
  );
}
