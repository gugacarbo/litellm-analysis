import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/features/app-shell/components/page-header";
import type {
  ApplyDiscoverySelectionInput,
  ProbeModelInput,
  TestProviderConnectionInput,
  UpdateProviderInput,
} from "@/features/model-admin/contracts/model-admin";
import {
  invalidateModelAdmin,
  modelAdminQueries,
} from "@/features/model-admin/query/query-options";
import {
  applyDiscoverySelection,
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
import { Spinner } from "@/shared/components/ui/spinner";
import { DiscoveryPanel } from "./discovery-panel";
import { ProviderForm } from "./provider-form";
import {
  toProviderErrorMessage,
  unwrapProviderResult,
} from "./provider-request";

type ProviderDetailPageProps = Readonly<{
  providerId: string;
  role: "admin" | "viewer";
}>;

export function ProviderDetailPage({
  providerId,
  role,
}: ProviderDetailPageProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [notice, setNotice] = useState<string>();
  const isAdmin = role === "admin";
  const providerQuery = useQuery(modelAdminQueries.provider(providerId));

  const invalidateProvider = async () => {
    await invalidateModelAdmin.provider(queryClient, providerId);
    setNotice("Alterações salvas.");
  };

  const updateMutation = useMutation({
    mutationFn: (input: UpdateProviderInput) =>
      unwrapProviderResult(updateProvider({ data: input })),
    onSuccess: async () => {
      await invalidateProvider();
      setEditing(false);
    },
  });
  const defaultMutation = useMutation({
    mutationFn: (input: { id: string; expectedRevision: number }) =>
      unwrapProviderResult(setDefaultProvider({ data: input })),
    onSuccess: invalidateProvider,
  });
  const deleteMutation = useMutation({
    mutationFn: () =>
      unwrapProviderResult(deleteProvider({ data: { id: providerId } })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["model-admin", "providers"],
      });
      setDeleteOpen(false);
      setDeleted(true);
    },
  });
  const testConnectionMutation = useMutation({
    mutationFn: (input: TestProviderConnectionInput) =>
      unwrapProviderResult(testProviderConnection({ data: input })),
  });
  const discoveryMutation = useMutation({
    mutationFn: () =>
      unwrapProviderResult(discoverModels({ data: { providerId } })),
  });
  const syncMutation = useMutation({
    mutationFn: (input: ApplyDiscoverySelectionInput) =>
      unwrapProviderResult(applyDiscoverySelection({ data: input })),
    onSuccess: async () => {
      await invalidateProvider();
      setNotice("Sincronização concluída.");
    },
  });
  const probeMutation = useMutation({
    mutationFn: (input: ProbeModelInput) =>
      unwrapProviderResult(probeModel({ data: input })),
  });

  if (deleted) {
    return (
      <main className="space-y-6">
        <Alert>
          <AlertTitle>Provider removido</AlertTitle>
          <AlertDescription>
            O provider foi removido com sucesso.
          </AlertDescription>
        </Alert>
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
          to="/providers"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Voltar para providers
        </Link>
      </main>
    );
  }

  if (providerQuery.isPending) {
    return (
      <main>
        <div className="flex items-center gap-2">
          <Spinner aria-label="Carregando provider" />
          <span>Carregando provider…</span>
        </div>
      </main>
    );
  }

  if (providerQuery.isError || !providerQuery.data) {
    return (
      <main className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar o provider</AlertTitle>
          <AlertDescription>
            {toProviderErrorMessage(providerQuery.error)}
          </AlertDescription>
        </Alert>
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
          to="/providers"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Voltar para providers
        </Link>
      </main>
    );
  }

  const provider = providerQuery.data;
  const mutationError =
    updateMutation.error ??
    defaultMutation.error ??
    deleteMutation.error ??
    discoveryMutation.error ??
    syncMutation.error ??
    probeMutation.error;

  return (
    <main className="space-y-6">
      <div className="space-y-3">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          to="/providers"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Providers
        </Link>
        <PageHeader
          title={
            <span className="flex flex-wrap items-center gap-2">
              {provider.name}
              {provider.isDefault ? <Badge>Padrão</Badge> : null}
            </span>
          }
          subtitle={`${provider.provider ?? "Adapter não informado"} · ${provider.baseUrl ?? "Sem Base URL"}`}
          actions={
            <Badge variant={isAdmin ? "default" : "secondary"}>
              {isAdmin ? "Administrador" : "Somente leitura"}
            </Badge>
          }
        />
      </div>
      {notice ? (
        <Alert>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}
      {mutationError ? (
        <Alert variant="destructive">
          <AlertTitle>Operação não concluída</AlertTitle>
          <AlertDescription>
            {toProviderErrorMessage(mutationError)}
          </AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do provider</CardTitle>
          <CardDescription>
            Gerencie a conexão, os modelos e a configuração deste destino.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
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
          {isAdmin ? (
            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button
                onClick={() => setEditing((current) => !current)}
                type="button"
                variant="outline"
              >
                {editing ? "Fechar edição" : "Editar configuração"}
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
                onClick={() => setDeleteOpen(true)}
                type="button"
                variant="destructive"
              >
                Remover
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
      {editing && isAdmin ? (
        <ProviderForm
          busy={updateMutation.isPending}
          initial={provider}
          testing={testConnectionMutation.isPending}
          onCancel={() => setEditing(false)}
          onTest={(input) => testConnectionMutation.mutateAsync(input)}
          onSubmit={async (input) => {
            if (!("id" in input)) throw new Error("Atualização inválida.");
            await updateMutation.mutateAsync(input);
          }}
        />
      ) : null}
      {isAdmin ? (
        <DiscoveryPanel
          applying={syncMutation.isPending}
          disabled={false}
          discovering={discoveryMutation.isPending}
          discovery={discoveryMutation.data}
          error={
            discoveryMutation.error
              ? toProviderErrorMessage(discoveryMutation.error)
              : undefined
          }
          onApply={async (input) => {
            await syncMutation.mutateAsync(input);
          }}
          onDiscover={async () => {
            await discoveryMutation.mutateAsync();
          }}
          onProbe={async (input) => {
            const result = await probeMutation.mutateAsync(input);
            return { content: result.content, truncated: result.truncated };
          }}
          probing={probeMutation.isPending}
          providerId={provider.id}
          syncResults={syncMutation.data}
        />
      ) : null}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover provider?</AlertDialogTitle>
            <AlertDialogDescription>
              Remover o provider {provider.name}? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
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
