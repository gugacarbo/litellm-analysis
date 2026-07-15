import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { PageHeader } from "@/features/app-shell/components/page-header";
import {
  type ProviderPublic,
  saveModelInputSchema,
} from "@/features/model-admin/contracts/model-admin";
import {
  invalidateModelAdmin,
  modelAdminQueries,
} from "@/features/model-admin/query/query-options";
import {
  deleteModel,
  saveModel,
  toggleModel,
} from "@/features/model-admin/server/model-admin.functions";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/shared/components/ui/empty";
import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

const createModelSchema = saveModelInputSchema.pick({
  providerId: true,
  modelId: true,
  displayName: true,
  enabled: true,
});
type CreateModelValues = z.infer<typeof createModelSchema>;

type ModelsPageProps = Readonly<{ role: "admin" | "viewer" }>;

function PublicError({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Could not load models</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function ModelsPage({ role }: ModelsPageProps) {
  const queryClient = useQueryClient();
  const modelsQuery = useQuery(modelAdminQueries.models());
  const providersQuery = useQuery(modelAdminQueries.providers());
  const [search, setSearch] = useState("");
  const [enabledFilter, setEnabledFilter] = useState<
    "all" | "enabled" | "disabled"
  >("all");
  const [showCreate, setShowCreate] = useState(false);
  const [actionError, setActionError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const form = useForm<CreateModelValues>({
    resolver: zodResolver(createModelSchema),
    defaultValues: {
      providerId: "",
      modelId: "",
      displayName: null,
      enabled: true,
    },
  });
  const closeCreateDialog = () => {
    form.reset();
    setShowCreate(false);
  };

  const createMutation = useMutation({
    mutationFn: async (values: CreateModelValues) => {
      const result = await saveModel({ data: values });
      if (!result.ok) throw result.error;
      return result.data;
    },
    onSuccess: async (model) => {
      await invalidateModelAdmin.model(queryClient, {
        id: model.id,
        providerId: model.providerId,
        aliasesChanged: true,
      });
      closeCreateDialog();
    },
    onError: (error) =>
      setActionError(
        error instanceof Error ? error.message : "Could not save model",
      ),
  });
  const toggleMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      providerId: string;
      enabled: boolean;
      revision: number;
    }) => {
      const result = await toggleModel({
        data: {
          id: input.id,
          enabled: input.enabled,
          expectedRevision: input.revision,
        },
      });
      if (!result.ok) throw result.error;
      return input;
    },
    onSuccess: (input) => invalidateModelAdmin.model(queryClient, input),
    onError: (error) =>
      setActionError(
        error instanceof Error ? error.message : "Could not update model",
      ),
  });
  const deleteMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      providerId: string;
      revision: number;
    }) => {
      const result = await deleteModel({
        data: { id: input.id, expectedRevision: input.revision },
      });
      if (!result.ok) throw result.error;
      return input;
    },
    onSuccess: async (input) => {
      await invalidateModelAdmin.model(queryClient, input);
      setConfirmDelete(null);
    },
    onError: (error) =>
      setActionError(
        error instanceof Error ? error.message : "Could not delete model",
      ),
  });

  if (modelsQuery.isPending)
    return <section aria-busy="true">Loading models…</section>;
  if (modelsQuery.isError) {
    return (
      <section className="space-y-4">
        <PublicError message={modelsQuery.error.message} />
        <Button onClick={() => void modelsQuery.refetch()}>Try again</Button>
      </section>
    );
  }

  const visibleModels = modelsQuery.data.filter((model) => {
    const matchesSearch =
      `${model.providerName} ${model.modelId} ${model.displayName ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesState =
      enabledFilter === "all" ||
      (enabledFilter === "enabled" ? model.enabled : !model.enabled);
    return matchesSearch && matchesState;
  });
  const confirmingModel = modelsQuery.data.find(
    (model) => model.id === confirmDelete,
  );

  return (
    <section className="space-y-6">
      <PageHeader
        title="Models"
        subtitle="Provider-scoped registry models."
        actions={
          role === "admin" ? (
            <Button onClick={() => setShowCreate(true)}>New model</Button>
          ) : null
        }
      />
      {actionError ? (
        <Alert variant="destructive">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}
      {role === "admin" ? (
        <Dialog
          open={showCreate}
          onOpenChange={(open) => {
            if (!open) closeCreateDialog();
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>New model</DialogTitle>
              <DialogDescription>
                Add a model to a provider-scoped registry.
              </DialogDescription>
            </DialogHeader>
            <form
              className="grid gap-4 md:grid-cols-2"
              noValidate
              onSubmit={form.handleSubmit((values) => {
                setActionError("");
                createMutation.mutate(values);
              })}
            >
              <Controller
                control={form.control}
                name="providerId"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Provider</FieldLabel>
                    <Select
                      items={Object.fromEntries([
                        ["none", "Choose a provider"],
                        ...(
                          (providersQuery.data as
                            | ProviderPublic[]
                            | undefined) ?? []
                        ).map((provider) => [provider.id, provider.name]),
                      ])}
                      value={field.value || "none"}
                      onValueChange={(value) =>
                        field.onChange(value === "none" ? "" : (value ?? ""))
                      }
                    >
                      <SelectTrigger
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        className="w-full"
                      >
                        <SelectValue placeholder="Choose a provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Choose a provider</SelectItem>
                        {(
                          providersQuery.data as ProviderPublic[] | undefined
                        )?.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="modelId"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Model ID</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="displayName"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Display name</FieldLabel>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(event.target.value || null)
                      }
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <div className="flex items-end gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving…" : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeCreateDialog}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Input
          aria-label="Search models"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search models"
          className="max-w-sm"
        />
        <Select
          items={{
            all: "All states",
            enabled: "Enabled",
            disabled: "Disabled",
          }}
          value={enabledFilter}
          onValueChange={(value) => {
            if (value) {
              setEnabledFilter(value as typeof enabledFilter);
            }
          }}
        >
          <SelectTrigger aria-label="Filter model status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            <SelectItem value="enabled">Enabled</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {modelsQuery.data.length === 0 ? (
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyTitle>No configured models yet.</EmptyTitle>
            <EmptyDescription>
              Create a model to start routing requests through a provider.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
      {modelsQuery.data.length > 0 && visibleModels.length === 0 ? (
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyTitle>No models match the current filters.</EmptyTitle>
            <EmptyDescription>
              Try changing the search text or status filter.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
      <div className="grid gap-3">
        {visibleModels.map((model) => (
          <Card key={model.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <a
                  className="font-medium hover:underline"
                  href={`/models/${model.id}/settings`}
                >
                  {model.providerName}/{model.modelId}
                </a>
                <p className="text-sm text-muted-foreground">
                  {model.displayName ?? "No display name"} · revision{" "}
                  {model.revision}
                </p>
                <Badge variant={model.enabled ? "secondary" : "outline"}>
                  {model.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              {role === "admin" ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={toggleMutation.isPending}
                    onClick={() =>
                      toggleMutation.mutate({
                        id: model.id,
                        providerId: model.providerId,
                        revision: model.revision,
                        enabled: !model.enabled,
                      })
                    }
                  >
                    {model.enabled ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmDelete(model.id)}
                  >
                    Delete
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
      <AlertDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setConfirmDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete model?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmingModel
                ? `This will permanently delete ${confirmingModel.providerName}/${confirmingModel.modelId}.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!confirmingModel || deleteMutation.isPending}
              onClick={() => {
                if (confirmingModel) {
                  deleteMutation.mutate({
                    id: confirmingModel.id,
                    providerId: confirmingModel.providerId,
                    revision: confirmingModel.revision,
                  });
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete model"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
