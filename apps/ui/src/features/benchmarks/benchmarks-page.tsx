import type {
  ArtificialAnalysisBenchmarkItem,
  BenchmarkPage,
  OpenRouterBenchmarkItem,
} from "@lite-llm/contracts/benchmarks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageContent } from "@/features/app-shell/components/page-content";
import { PageHeader } from "@/features/app-shell/components/page-header";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Spinner } from "@/shared/components/ui/spinner";
import {
  BenchmarkFilters,
  BenchmarkPagination,
  SnapshotInfo,
} from "./benchmark-filters";
import { AaSection, OpenRouterSection } from "./benchmark-tables";
import type { BenchmarkListInput } from "./contracts/benchmarks";
import { benchmarkQueries } from "./query/query-options";
import { syncBenchmarks } from "./server/benchmarks.functions";

type Props = {
  role: string;
  source: "aa" | "openrouter";
  search: BenchmarkListInput;
};
type SyncControl = {
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  mutate: () => void;
};
type PublicBenchmarkError = Error & { code?: string };

function hasErrorCode(error: unknown, code: string): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as PublicBenchmarkError).code === code
  );
}

export function BenchmarksPage({ role, source, search }: Props) {
  const queryClient = useQueryClient();
  const sync = useMutation({
    mutationFn: async () => {
      const result = await syncBenchmarks({
        data: {
          catalog: source === "aa" ? "artificial-analysis" : "openrouter",
        },
      });
      if (!result.ok) {
        throw Object.assign(new Error(result.error.message), {
          code: result.error.code,
        });
      }
      return result.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey:
          source === "aa" ? ["benchmarks", "aa"] : ["benchmarks", "openrouter"],
      }),
  });
  return source === "aa" ? (
    <BenchmarkContent role={role} search={search} source="aa" sync={sync} />
  ) : (
    <BenchmarkContent
      role={role}
      search={search}
      source="openrouter"
      sync={sync}
    />
  );
}

function BenchmarkContent({
  role,
  source,
  search,
  sync,
}: Props & { sync: SyncControl }) {
  const [groupVariants, setGroupVariants] = useState({
    aa: true,
    openrouterAa: true,
    openrouterArena: true,
  });
  const query = useQuery<
    BenchmarkPage<ArtificialAnalysisBenchmarkItem | OpenRouterBenchmarkItem>
  >(
    source === "aa"
      ? (benchmarkQueries.aa(search) as never)
      : (benchmarkQueries.openrouter(search) as never),
  );
  const data = query.data;
  const title =
    source === "aa" ? "Artificial Analysis" : "OpenRouter Benchmarks";
  const snapshotMissing = hasErrorCode(query.error, "SNAPSHOT_NOT_FOUND");
  const credentialMissing = hasErrorCode(
    sync.error,
    "CREDENTIAL_NOT_CONFIGURED",
  );
  return (
    <PageContent>
      <PageHeader
        title={title}
        subtitle="Snapshot atual persistido; a leitura não consulta fornecedores externos."
        actions={
          role === "admin" ? (
            <Button disabled={sync.isPending} onClick={() => sync.mutate()}>
              {sync.isPending ? "Sincronizando…" : "Sincronizar"}
            </Button>
          ) : null
        }
      />
      <nav aria-label="Catálogos de benchmarks" className="flex gap-3 text-sm">
        <Link activeProps={{ className: "font-semibold" }} to="/benchmarks/aa">
          Artificial Analysis
        </Link>
        <Link
          activeProps={{ className: "font-semibold" }}
          to="/benchmarks/openrouter"
        >
          OpenRouter
        </Link>
      </nav>
      <Card>
        <CardContent className="pt-6">
          <BenchmarkFilters search={search} source={source} />
        </CardContent>
      </Card>
      {credentialMissing ? (
        <CatalogSetupState role={role} sync={sync} type="credential" />
      ) : sync.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Falha ao sincronizar</AlertTitle>
          <AlertDescription>
            Não foi possível sincronizar o catálogo. Tente novamente.
          </AlertDescription>
        </Alert>
      ) : null}
      {query.isPending ? (
        <section aria-busy="true" className="flex items-center gap-2">
          <Spinner /> Carregando snapshot…
        </section>
      ) : null}
      {snapshotMissing ? (
        <CatalogSetupState role={role} sync={sync} type="snapshot" />
      ) : query.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar benchmarks</AlertTitle>
          <AlertDescription>
            Não foi possível consultar este catálogo. Tente novamente.
          </AlertDescription>
          <Button
            className="mt-3"
            onClick={() => void query.refetch()}
            variant="outline"
          >
            Tentar novamente
          </Button>
        </Alert>
      ) : null}
      {data ? (
        <section className="space-y-4">
          <SnapshotInfo
            {...data.metadata.attribution}
            count={data.total}
            fetchedAt={data.metadata.fetchedAt}
          />
          {data.items.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-muted-foreground">
                Nenhum benchmark corresponde aos filtros.
              </CardContent>
            </Card>
          ) : source === "aa" ? (
            <AaSection
              groupVariants={groupVariants.aa}
              items={data.items as ArtificialAnalysisBenchmarkItem[]}
              onGroupVariantsChange={(checked) =>
                setGroupVariants((current) => ({ ...current, aa: checked }))
              }
            />
          ) : (
            <div className="space-y-4">
              <OpenRouterSection
                groupVariants={groupVariants.openrouterAa}
                items={(data.items as OpenRouterBenchmarkItem[]).filter(
                  (item) => item.subsource === "artificial-analysis",
                )}
                onGroupVariantsChange={(checked) =>
                  setGroupVariants((current) => ({
                    ...current,
                    openrouterAa: checked,
                  }))
                }
                title="Artificial Analysis via OpenRouter"
              />
              <OpenRouterSection
                groupVariants={groupVariants.openrouterArena}
                items={(data.items as OpenRouterBenchmarkItem[]).filter(
                  (item) => item.subsource === "design-arena",
                )}
                onGroupVariantsChange={(checked) =>
                  setGroupVariants((current) => ({
                    ...current,
                    openrouterArena: checked,
                  }))
                }
                title="Design Arena"
              />
            </div>
          )}
          <BenchmarkPagination
            page={data.page}
            pageCount={data.pageCount}
            search={search}
            source={source}
          />
        </section>
      ) : null}
    </PageContent>
  );
}

function CatalogSetupState({
  role,
  sync,
  type,
}: {
  role: string;
  sync: SyncControl;
  type: "credential" | "snapshot";
}) {
  const credential = type === "credential";
  const title = credential
    ? "Credencial do catálogo não configurada"
    : "Catálogo ainda não sincronizado";
  const description = credential
    ? role === "admin"
      ? "Configure a credencial antes de sincronizar este catálogo."
      : "A credencial deste catálogo ainda não foi configurada. Peça a um administrador para configurá-la."
    : role === "admin"
      ? "Sincronize o catálogo para disponibilizá-lo aos usuários autenticados."
      : "Este catálogo ainda não está disponível. Peça a um administrador para sincronizá-lo.";

  return (
    <Card role="status">
      <CardContent className="space-y-3 pt-6">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
        {role === "admin" ? (
          credential ? (
            <Link className="text-sm underline" to="/secrets">
              Configurar credencial
            </Link>
          ) : (
            <Button disabled={sync.isPending} onClick={() => sync.mutate()}>
              {sync.isPending ? "Sincronizando…" : "Sincronizar catálogo"}
            </Button>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}
