import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/shared/components/ui/empty";
import { Input } from "@/shared/components/ui/input";
import type { DomainError } from "../contracts/model-admin";
import {
  invalidateModelAdmin,
  modelAdminQueries,
} from "../query/query-options";
import { deleteAlias, updateAlias } from "../server/model-admin.functions";
import { AliasForm } from "./alias-form";

type Role = "admin" | "viewer";
type SelectedAlias = {
  id: string;
  alias: string;
  targetModelId: string;
  revision: number;
};

function errorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return "The alias could not be changed. Try again.";
}

function throwDomainError(result: DomainError): never {
  throw result.error;
}

export function AliasesPage({ role }: Readonly<{ role: Role }>) {
  const queryClient = useQueryClient();
  const aliasesQuery = useQuery(modelAdminQueries.aliases());
  const modelsQuery = useQuery(modelAdminQueries.models());
  const [filter, setFilter] = useState("");
  const [selectedAlias, setSelectedAlias] = useState<SelectedAlias | null>(
    null,
  );
  const [deleteCandidate, setDeleteCandidate] = useState<SelectedAlias | null>(
    null,
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const canManage = role === "admin";
  const aliases = aliasesQuery.data ?? [];
  const models = modelsQuery.data ?? [];
  const filteredAliases = useMemo(() => {
    const term = filter.trim().toLocaleLowerCase();
    return term
      ? aliases.filter(
          (alias) =>
            alias.alias.toLocaleLowerCase().includes(term) ||
            alias.aliasNormalized.toLocaleLowerCase().includes(term),
        )
      : aliases;
  }, [aliases, filter]);

  const saveMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      expectedRevision: number;
      alias: string;
      targetModelId: string;
      previousTargetModelId: string;
    }) => {
      const result = await updateAlias({
        data: {
          id: input.id,
          expectedRevision: input.expectedRevision,
          alias: input.alias,
          targetModelId: input.targetModelId,
        },
      });
      if (!result.ok) return throwDomainError(result);
      return {
        ...result.data,
        previousTargetModelId: input.previousTargetModelId,
      };
    },
    onSuccess: async (alias) => {
      await Promise.all([
        invalidateModelAdmin.alias(queryClient, alias.targetModelId),
        alias.previousTargetModelId === alias.targetModelId
          ? Promise.resolve()
          : invalidateModelAdmin.alias(
              queryClient,
              alias.previousTargetModelId,
            ),
      ]);
      setSelectedAlias(null);
      setFeedback("Alias saved.");
    },
    onError: (error) => {
      setFeedback(errorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (alias: SelectedAlias) => {
      const result = await deleteAlias({
        data: { id: alias.id, expectedRevision: alias.revision },
      });
      if (!result.ok) return throwDomainError(result);
      return alias;
    },
    onSuccess: async (alias) => {
      await invalidateModelAdmin.alias(queryClient, alias.targetModelId);
      setSelectedAlias(null);
      setDeleteCandidate(null);
      setFeedback("Alias deleted.");
    },
    onError: (error) => {
      setFeedback(errorMessage(error));
    },
  });

  if (aliasesQuery.isLoading || modelsQuery.isLoading) {
    return <AliasesState title="Loading aliases..." />;
  }

  if (aliasesQuery.isError || modelsQuery.isError) {
    return (
      <AliasesState
        actionLabel="Try again"
        onAction={() =>
          void Promise.all([aliasesQuery.refetch(), modelsQuery.refetch()])
        }
        title="Aliases could not be loaded."
      />
    );
  }

  return (
    <section className="space-y-6 p-6 md:p-8">
      <header>
        <h1 className="text-3xl font-bold">Aliases</h1>
        <p className="mt-2 text-muted-foreground">
          Review each routing alias and its provider-scoped target model.
        </p>
      </header>

      {feedback ? (
        <Alert variant="destructive">
          <AlertDescription>{feedback}</AlertDescription>
        </Alert>
      ) : null}

      <Input
        aria-label="Filter aliases"
        onChange={(event) => setFilter(event.target.value)}
        placeholder="Filter aliases"
        value={filter}
      />

      {selectedAlias && canManage ? (
        <AliasForm
          alias={selectedAlias}
          models={models}
          onCancel={() => setSelectedAlias(null)}
          onSubmit={async (values) => {
            setFeedback(null);
            try {
              await saveMutation.mutateAsync({
                ...values,
                id: selectedAlias.id,
                expectedRevision: selectedAlias.revision,
                previousTargetModelId: selectedAlias.targetModelId,
              });
            } catch {
              // The mutation's onError exposes only the server's public error.
            }
          }}
          pending={saveMutation.isPending}
        />
      ) : null}

      {filteredAliases.length === 0 ? (
        <AliasesState
          title={
            aliases.length === 0
              ? "No aliases have been configured."
              : "No aliases match this filter."
          }
        />
      ) : (
        <div className="grid gap-3">
          {filteredAliases.map((alias) => {
            const model = models.find(
              (candidate) => candidate.id === alias.targetModelId,
            );
            return (
              <Card key={alias.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {alias.alias}
                    <Badge variant="outline">Alias</Badge>
                  </CardTitle>
                  <CardDescription>
                    Normalized: {alias.aliasNormalized}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>
                    <span className="font-medium">Target UUID:</span>{" "}
                    {alias.targetModelId}
                  </p>
                  <p>
                    <span className="font-medium">Target:</span>{" "}
                    {model
                      ? `${model.providerName} / ${model.modelId}`
                      : "Target model no longer exists"}
                  </p>
                  {canManage ? (
                    <div className="flex gap-2">
                      <Button
                        aria-label="Edit alias"
                        onClick={() => {
                          setFeedback(null);
                          setSelectedAlias(alias);
                        }}
                        type="button"
                        variant="outline"
                      >
                        Edit
                      </Button>
                      <Button
                        aria-label="Delete alias"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          setFeedback(null);
                          setDeleteCandidate(alias);
                        }}
                        type="button"
                        variant="destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <AlertDialog
        open={Boolean(deleteCandidate)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleteCandidate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete alias?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCandidate
                ? `This will permanently delete ${deleteCandidate.alias}.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!deleteCandidate || deleteMutation.isPending}
              onClick={() => {
                if (deleteCandidate) {
                  deleteMutation.mutate(deleteCandidate);
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete alias"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function AliasesState({
  actionLabel,
  onAction,
  title,
}: Readonly<{ actionLabel?: string; onAction?: () => void; title: string }>) {
  return (
    <Empty className="border bg-card">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        {actionLabel ? (
          <EmptyDescription>
            Refresh the page to try loading aliases again.
          </EmptyDescription>
        ) : null}
      </EmptyHeader>
      {actionLabel && onAction ? (
        <Button onClick={onAction} type="button" variant="outline">
          {actionLabel}
        </Button>
      ) : null}
    </Empty>
  );
}
