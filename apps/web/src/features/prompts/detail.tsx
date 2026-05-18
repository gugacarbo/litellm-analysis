import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getEval } from "@/shared/lib/api-client/prompt-evals";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { PageLayout } from "../../components/ui/page-layout";
import { EvalDetailTabs } from "./components/eval-detail-tabs";
import { formatRelativeTime, statusVariant } from "./utils";

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
        <p className="text-sm text-muted-foreground">
          ID do eval não informado.
        </p>
      </PageLayout>
    );
  }

  const detail = detailQuery.data;

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
            <Badge variant={statusVariant(detail.status)}>
              {detail.status}
            </Badge>
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
        <EvalDetailTabs detail={detail} />
      )}
    </PageLayout>
  );
}
