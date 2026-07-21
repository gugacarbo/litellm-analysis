import type {
  ArtificialAnalysisBenchmarkItem,
  BenchmarkPage,
  OpenRouterBenchmarkItem,
} from "@lite-llm/contracts/benchmarks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
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
import { AaTable, OpenRouterSection } from "./benchmark-tables";
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

export function BenchmarksPage({ role, source, search }: Props) {
  const queryClient = useQueryClient();
  const sync = useMutation({
    mutationFn: async () => {
      const result = await syncBenchmarks({
        data: {
          catalog: source === "aa" ? "artificial-analysis" : "openrouter",
        },
      });
      if (!result.ok) throw new Error(result.error.message);
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
      {sync.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Falha ao sincronizar</AlertTitle>
          <AlertDescription>
            {sync.error?.message ?? "Não foi possível sincronizar o catálogo."}
          </AlertDescription>
        </Alert>
      ) : null}
      {query.isPending ? (
        <section aria-busy="true" className="flex items-center gap-2">
          <Spinner /> Carregando snapshot…
        </section>
      ) : null}
      {query.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar benchmarks</AlertTitle>
          <AlertDescription>{query.error.message}</AlertDescription>
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
            <Card>
              <CardContent className="pt-6">
                <AaTable
                  items={data.items as ArtificialAnalysisBenchmarkItem[]}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <OpenRouterSection
                items={(data.items as OpenRouterBenchmarkItem[]).filter(
                  (item) => item.subsource === "artificial-analysis",
                )}
                title="Artificial Analysis via OpenRouter"
              />
              <OpenRouterSection
                items={(data.items as OpenRouterBenchmarkItem[]).filter(
                  (item) => item.subsource === "design-arena",
                )}
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
