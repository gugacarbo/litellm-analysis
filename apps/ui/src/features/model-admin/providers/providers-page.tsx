import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/features/app-shell/components/page-header";
import type {
  CreateProviderInput,
  ProviderPublic,
  TestProviderConnectionInput,
} from "@/features/model-admin/contracts/model-admin";
import {
  invalidateModelAdmin,
  modelAdminQueries,
} from "@/features/model-admin/query/query-options";
import {
  createProvider,
  testProviderConnection,
} from "@/features/model-admin/server/model-admin.functions";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert";
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
import { ProviderForm } from "./provider-form";
import {
  toProviderErrorMessage,
  unwrapProviderResult,
} from "./provider-request";

type ProvidersPageProps = Readonly<{ role: "admin" | "viewer" }>;

export function ProvidersPage({ role }: ProvidersPageProps) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [notice, setNotice] = useState<string>();
  const isAdmin = role === "admin";
  const providersQuery = useQuery(modelAdminQueries.providers());

  const createMutation = useMutation({
    mutationFn: (input: CreateProviderInput) =>
      unwrapProviderResult(createProvider({ data: input })),
    onSuccess: async (provider) => {
      await invalidateModelAdmin.provider(queryClient, provider.id);
      setShowCreate(false);
      setNotice("Provider criado.");
    },
  });
  const testConnectionMutation = useMutation({
    mutationFn: (input: TestProviderConnectionInput) =>
      unwrapProviderResult(testProviderConnection({ data: input })),
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
            {toProviderErrorMessage(providersQuery.error)}
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
      {createMutation.error ? (
        <Alert variant="destructive">
          <AlertTitle>Operação não concluída</AlertTitle>
          <AlertDescription>
            {toProviderErrorMessage(createMutation.error)}
          </AlertDescription>
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
          {providers.map((provider) => (
            <a
              aria-label={`Abrir provider ${provider.name}`}
              className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={`/providers/${provider.id}`}
              key={provider.id}
            >
              <Card className="h-full transition-colors hover:bg-accent/50 focus-within:bg-accent/50">
                <CardHeader className="gap-2">
                  <CardTitle className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="truncate">{provider.name}</span>
                      {provider.isDefault ? <Badge>Padrão</Badge> : null}
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    />
                  </CardTitle>
                  <CardDescription className="break-all">
                    {provider.provider ?? "Adapter não informado"} ·{" "}
                    {provider.baseUrl ?? "Sem Base URL"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
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
                  </dl>
                </CardContent>
              </Card>
            </a>
          ))}
        </section>
      )}
    </main>
  );
}
