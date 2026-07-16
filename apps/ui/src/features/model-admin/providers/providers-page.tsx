import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { PageHeader } from "@/features/app-shell/components/page-header";
import type {
  ApplyDiscoverySelectionInput,
  CreateProviderInput,
  ProbeModelInput,
  ProviderPublic,
  Result,
  TestProviderConnectionInput,
  UpdateProviderInput,
} from "@/features/model-admin/contracts/model-admin";
import {
  invalidateModelAdmin,
  modelAdminQueries,
} from "@/features/model-admin/query/query-options";
import {
  applyDiscoverySelection,
  createProvider,
  deleteProvider,
  discoverModels,
  probeModel,
  setDefaultProvider,
  testProviderConnection,
  updateProvider,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Spinner } from "@/shared/components/ui/spinner";
import { DiscoveryPanel } from "./discovery-panel";
import { ProviderForm } from "./provider-form";

type PublicError = {
  code: string;
  message: string;
  retryable: boolean;
  dependentModelCount?: number;
};

class ProviderRequestError extends Error {
  readonly details: PublicError;

  constructor(details: PublicError) {
    super(details.message);
    this.name = "ProviderRequestError";
    this.details = details;
  }
}

async function unwrap<T>(request: Promise<Result<T>>): Promise<T> {
  const result = await request;
  if (!result.ok) throw new ProviderRequestError(result.error);
  return result.data;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ProviderRequestError) {
    if (error.details.dependentModelCount !== undefined) {
      return `Há ${error.details.dependentModelCount} modelo(s) dependente(s). Remova ou mova-os antes de excluir este provider.`;
    }
    return error.details.retryable
      ? `${error.message} Você pode tentar novamente.`
      : error.message;
  }
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a operação.";
}

type ProvidersPageProps = Readonly<{ role: "admin" | "viewer" }>;

export function ProvidersPage({ role }: ProvidersPageProps) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string>();
  const [activeProviderId, setActiveProviderId] = useState<string>();
  const [deleteCandidate, setDeleteCandidate] = useState<ProviderPublic>();
  const [showCreate, setShowCreate] = useState(false);
  const [notice, setNotice] = useState<string>();
  const isAdmin = role === "admin";
  const providersQuery = useQuery(modelAdminQueries.providers());

  const invalidateProvider = async (providerId: string) => {
    await invalidateModelAdmin.provider(queryClient, providerId);
    setNotice("Alterações salvas.");
  };

  const createMutation = useMutation({
    mutationFn: (input: CreateProviderInput) =>
      unwrap(createProvider({ data: input })),
    onSuccess: async (provider) => {
      await invalidateProvider(provider.id);
      setShowCreate(false);
    },
  });
  const testConnectionMutation = useMutation({
    mutationFn: (input: TestProviderConnectionInput) =>
      unwrap(testProviderConnection({ data: input })),
  });
  const updateMutation = useMutation({
    mutationFn: (input: UpdateProviderInput) =>
      unwrap(updateProvider({ data: input })),
    onSuccess: async (provider) => invalidateProvider(provider.id),
  });
  const defaultMutation = useMutation({
    mutationFn: (input: { id: string; expectedRevision: number }) =>
      unwrap(setDefaultProvider({ data: input })),
    onSuccess: async (provider) => invalidateProvider(provider.id),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => unwrap(deleteProvider({ data: { id } })),
    onSuccess: async (_, id) => {
      await queryClient.invalidateQueries({
        queryKey: ["model-admin", "providers"],
      });
      if (activeProviderId === id) setActiveProviderId(undefined);
      setDeleteCandidate(undefined);
      setNotice("Provider removido.");
    },
  });
  const discoveryMutation = useMutation({
    mutationFn: (providerId: string) =>
      unwrap(discoverModels({ data: { providerId } })),
  });
  const syncMutation = useMutation({
    mutationFn: (input: ApplyDiscoverySelectionInput) =>
      unwrap(applyDiscoverySelection({ data: input })),
    onSuccess: async (_, input) => {
      await invalidateModelAdmin.provider(queryClient, input.providerId);
      setNotice("Sincronização concluída.");
    },
  });
  const probeMutation = useMutation({
    mutationFn: (input: ProbeModelInput) => unwrap(probeModel({ data: input })),
  });

  if (providersQuery.isPending) {
    return (
      <main>
        <div className="flex items-center gap-2">
          <Spinner aria-label="Carregando providers" />
          <span>Carregando providers…</span>
        </div>
      </main>
    );
  }

  if (providersQuery.isError) {
    return (
      <main>
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar providers</AlertTitle>
          <AlertDescription>
            {toErrorMessage(providersQuery.error)}
          </AlertDescription>
        </Alert>
        <Button
          className="mt-3"
          onClick={() => void providersQuery.refetch()}
          type="button"
        >
          Tentar novamente
        </Button>
      </main>
    );
  }

  const providers = providersQuery.data as ProviderPublic[];
  const activeProvider = providers.find(
    (provider) => provider.id === activeProviderId,
  );
  const mutationError =
    createMutation.error ??
    updateMutation.error ??
    defaultMutation.error ??
    deleteMutation.error ??
    discoveryMutation.error ??
    syncMutation.error ??
    probeMutation.error;

  return (
    <main className="space-y-6">
      <PageHeader
        title="Providers"
        subtitle="Configure destinos, credenciais e o catálogo de modelos."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin ? (
              <Badge>Administrador</Badge>
            ) : (
              <Badge variant="secondary">Somente leitura</Badge>
            )}
            {isAdmin ? (
              <Button onClick={() => setShowCreate(true)} type="button">
                Novo provider
              </Button>
            ) : null}
          </div>
        }
      />
      {notice ? (
        <Alert>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}
      {mutationError ? (
        <Alert variant="destructive">
          <AlertTitle>Operação não concluída</AlertTitle>
          <AlertDescription>{toErrorMessage(mutationError)}</AlertDescription>
        </Alert>
      ) : null}
      {isAdmin ? (
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo provider</DialogTitle>
              <DialogDescription>
                Configure o destino e a credencial de um provider.
              </DialogDescription>
            </DialogHeader>
            <ProviderForm
              busy={createMutation.isPending}
              framed={false}
              showTitle={false}
              testing={testConnectionMutation.isPending}
              onCancel={() => setShowCreate(false)}
              onTest={(input) => testConnectionMutation.mutateAsync(input)}
              onSubmit={async (input) => {
                if ("id" in input) throw new Error("Criação inválida.");
                await createMutation.mutateAsync(input);
              }}
            />
          </DialogContent>
        </Dialog>
      ) : null}
      {providers.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum provider configurado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Um administrador pode adicionar o primeiro provider.
            </p>
          </CardContent>
        </Card>
      ) : (
        <section aria-label="Lista de providers" className="grid gap-4">
          {providers.map((provider) => {
            const editing = provider.id === editingId;
            return (
              <Card key={provider.id}>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    {provider.name}
                    {provider.isDefault ? <Badge>Padrão</Badge> : null}
                  </CardTitle>
                  <CardDescription>
                    {provider.provider ?? "Adapter não informado"} ·{" "}
                    {provider.baseUrl ?? "Sem Base URL"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <dl className="grid gap-1 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-muted-foreground">Credencial</dt>
                      <dd>
                        {provider.credentialStatus === "configured"
                          ? "Configurada"
                          : "Ausente"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Modelos</dt>
                      <dd>{provider.modelCount}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Revisão</dt>
                      <dd>{provider.revision}</dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap gap-2">
                    {isAdmin ? (
                      <>
                        <Button
                          onClick={() => setActiveProviderId(provider.id)}
                          type="button"
                          variant="outline"
                        >
                          Discovery e probe
                        </Button>
                        <Button
                          onClick={() =>
                            setEditingId(editing ? undefined : provider.id)
                          }
                          type="button"
                          variant="outline"
                        >
                          {editing ? "Fechar edição" : "Editar"}
                        </Button>
                        {!provider.isDefault ? (
                          <Button
                            disabled={defaultMutation.isPending}
                            onClick={() =>
                              void defaultMutation.mutateAsync({
                                id: provider.id,
                                expectedRevision: provider.revision,
                              })
                            }
                            type="button"
                            variant="outline"
                          >
                            Tornar padrão
                          </Button>
                        ) : null}
                        <Button
                          disabled={deleteMutation.isPending}
                          onClick={() => setDeleteCandidate(provider)}
                          type="button"
                          variant="destructive"
                        >
                          Remover
                        </Button>
                      </>
                    ) : null}
                  </div>
                  {editing && isAdmin ? (
                    <ProviderForm
                      busy={updateMutation.isPending}
                      initial={provider}
                      onSubmit={async (input) => {
                        if (!("id" in input))
                          throw new Error("Atualização inválida.");
                        await updateMutation.mutateAsync(input);
                        setEditingId(undefined);
                      }}
                    />
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}
      {activeProvider ? (
        <DiscoveryPanel
          applying={syncMutation.isPending}
          disabled={!isAdmin}
          discovering={
            discoveryMutation.isPending &&
            discoveryMutation.variables === activeProvider.id
          }
          discovery={
            discoveryMutation.variables === activeProvider.id
              ? discoveryMutation.data
              : undefined
          }
          error={
            discoveryMutation.variables === activeProvider.id &&
            discoveryMutation.error
              ? toErrorMessage(discoveryMutation.error)
              : undefined
          }
          onApply={async (input) => {
            await syncMutation.mutateAsync(input);
          }}
          onDiscover={async () => {
            await discoveryMutation.mutateAsync(activeProvider.id);
          }}
          onProbe={async (input) => {
            const result = await probeMutation.mutateAsync(input);
            return { content: result.content, truncated: result.truncated };
          }}
          probing={probeMutation.isPending}
          providerId={activeProvider.id}
          syncResults={
            syncMutation.variables?.providerId === activeProvider.id
              ? syncMutation.data
              : undefined
          }
        />
      ) : null}
      <AlertDialog
        open={Boolean(deleteCandidate)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleteCandidate(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover provider?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCandidate
                ? `Remover o provider ${deleteCandidate.name}? Esta ação não pode ser desfeita.`
                : "Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!deleteCandidate || deleteMutation.isPending}
              onClick={() => {
                if (deleteCandidate) deleteMutation.mutate(deleteCandidate.id);
              }}
              variant="destructive"
            >
              {deleteMutation.isPending ? "Removendo…" : "Remover provider"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
