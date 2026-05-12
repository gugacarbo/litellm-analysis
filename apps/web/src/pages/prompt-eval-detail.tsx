import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { CategoryTable } from "../components/prompt-evals/category-table";
import { FailedCasesList } from "../components/prompt-evals/failed-cases-list";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { PageLayout } from "../components/ui/page-layout";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { getEval } from "../lib/api-client/prompt-evals";
import {
  formatDuration,
  formatPrecision,
  formatRelativeTime,
  formatTimestamp,
  statusVariant,
} from "./prompt-evals/utils";

export function PromptEvalDetailPage() {
  const { id } = useParams<{ id: string }>();

  const detailQuery = useQuery({
    queryKey: ["prompt-eval-detail", id],
    queryFn: () => {
      if (!id) throw new Error("Eval id not provided");
      return getEval(id);
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 3000;
      const terminal = ["succeeded", "failed", "cancelled"];
      return terminal.includes(data.status) ? false : 2000;
    },
  });

  if (!id) {
    return (
      <PageLayout title="Eval Detail" subtitle="Run not found">
        <p className="text-sm text-muted-foreground">ID do eval não informado.</p>
      </PageLayout>
    );
  }

  const detail = detailQuery.data;
  const categories = detail?.categories ?? [];
  const cases = detail?.cases ?? [];

  return (
    <PageLayout
      title="Eval Detail"
      subtitle={
        detail
          ? `${detail.model} • iniciado ${formatRelativeTime(detail.startedAt)}`
          : `Run ${id}`
      }
      showFilters={false}
      buttons={
        <>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/prompt-evals">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          {detail && (
            <Badge variant={statusVariant(detail.status)}>{detail.status}</Badge>
          )}
          {detailQuery.isFetching && (
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </>
      }
    >
      {detailQuery.isLoading ? (
        <p className="text-sm text-muted-foreground py-6">Carregando...</p>
      ) : detailQuery.error ? (
        <p className="text-sm text-destructive py-6">
          Falha ao carregar detalhes do eval.
        </p>
      ) : !detail ? (
        <p className="text-sm text-muted-foreground py-6">
          Detalhes não encontrados para este eval.
        </p>
      ) : (
        <Tabs defaultValue="summary" className="gap-4">
          <TabsList variant="line">
            <TabsTrigger value="summary">Resumo</TabsTrigger>
            <TabsTrigger value="steps">Steps</TabsTrigger>
            <TabsTrigger value="cases">Casos</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={statusVariant(detail.status)}>{detail.status}</Badge>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Macro F1</p>
                <p className="font-mono text-sm">{formatPrecision(detail.macroF1, 4)}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Threshold</p>
                <p className="font-mono text-sm">{detail.threshold}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Duração</p>
                <p className="font-mono text-sm">
                  {formatDuration(detail.startedAt, detail.finishedAt)}
                </p>
              </div>
            </div>

            <div className="rounded-md border p-3 text-sm space-y-2">
              <p>
                <span className="text-muted-foreground">Início:</span>{" "}
                <span className="font-mono">{formatTimestamp(detail.startedAt)}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Fim:</span>{" "}
                <span className="font-mono">
                  {detail.finishedAt ? formatTimestamp(detail.finishedAt) : "—"}
                </span>
              </p>
              {detail.error && (
                <p className="rounded bg-destructive/10 p-2 text-destructive">
                  {detail.error}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Métricas por Categoria</h4>
              {categories.length > 0 ? (
                <CategoryTable categories={categories} threshold={detail.threshold} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Este eval não retornou métricas de categoria.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="steps" className="space-y-2">
            {detail.steps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum step registrado.</p>
            ) : (
              detail.steps.map((step) => (
                <div key={step.id} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-sm">{step.step}</p>
                    <Badge variant={statusVariant(step.status)}>{step.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      Início: <span className="font-mono">{formatTimestamp(step.startedAt)}</span>
                    </p>
                    <p>
                      Fim: <span className="font-mono">{step.finishedAt ? formatTimestamp(step.finishedAt) : "—"}</span>
                    </p>
                    <p>
                      Progresso: <span className="font-mono">{step.progressPct}%</span>
                    </p>
                  </div>
                  {step.message && (
                    <>
                      <Separator />
                      <p className="text-sm whitespace-pre-wrap">{step.message}</p>
                    </>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="cases" className="space-y-3">
            {cases.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Este eval não retornou casos detalhados.
              </p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Total: {cases.length} • Falhas: {cases.filter((c) => !c.passed).length}
                </p>
                <FailedCasesList cases={cases} />
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </PageLayout>
  );
}
