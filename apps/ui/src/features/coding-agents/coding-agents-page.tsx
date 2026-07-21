import { useMutation, useQuery } from "@tanstack/react-query";
import { CopyIcon, DownloadIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/features/app-shell/components/page-header";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import type {
  CodingAgentArtifact,
  CodingAgentProvider,
} from "./contracts/coding-agents";
import {
  codingAgentsOverviewQuery,
  unwrapCodingAgentResult,
} from "./query/query-options";
import { generateCodingAgentArtifact } from "./server/coding-agents.functions";

function downloadArtifact(artifact: CodingAgentArtifact) {
  const blob = new Blob([artifact.content], { type: artifact.mediaType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = artifact.fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function CodingAgentsPage() {
  const overviewQuery = useQuery(codingAgentsOverviewQuery());
  const [useHebo, setUseHebo] = useState(true);
  const [artifact, setArtifact] = useState<CodingAgentArtifact | null>(null);
  const artifactMutation = useMutation({
    mutationFn: (mode: "hebo" | "providers") =>
      unwrapCodingAgentResult(() =>
        generateCodingAgentArtifact({ data: { mode } }),
      ),
    onSuccess: setArtifact,
  });

  if (overviewQuery.isPending)
    return (
      <main className="p-6 text-muted-foreground">
        Carregando Coding Agents…
      </main>
    );
  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <main className="space-y-3 p-6">
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar Coding Agents</AlertTitle>
          <AlertDescription>{overviewQuery.error?.message}</AlertDescription>
        </Alert>
        <Button onClick={() => void overviewQuery.refetch()}>
          Tentar novamente
        </Button>
      </main>
    );
  }

  const overview = overviewQuery.data;
  const mode = useHebo ? "hebo" : "providers";
  return (
    <main className="space-y-6">
      <PageHeader
        title="Coding Agents"
        subtitle="Gere uma configuração OpenCode usando o Hebo ou todos os providers já configurados no app."
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle>OpenCode</CardTitle>
            <CardDescription>
              O arquivo inclui todos os modelos habilitados. Nenhuma chave real
              é exportada.
            </CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger
              render={
                <label className="flex shrink-0 items-center gap-2 text-sm font-medium" />
              }
            >
              Use proxy
              <Switch
                checked={useHebo}
                onCheckedChange={setUseHebo}
                aria-label="Use proxy"
              />
            </TooltipTrigger>
            <TooltipContent>
              Usa o proxy do app quando ligado; quando desligado, usa os
              providers configurados diretamente.
            </TooltipContent>
          </Tooltip>
        </CardHeader>
        <CardContent className="space-y-5">
          {useHebo && !overview.publicBaseUrlConfigured ? (
            <Alert>
              <AlertTitle>URL pública do Hebo ainda não configurada</AlertTitle>
              <AlertDescription>
                Defina <code>MODEL_PROXY_PUBLIC_BASE_URL</code> para gerar o
                arquivo com Hebo.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {overview.enabledModelCount} modelos habilitados ·{" "}
              {overview.providers.length} providers configurados
            </p>
            <Button
              disabled={
                artifactMutation.isPending ||
                (useHebo && !overview.publicBaseUrlConfigured)
              }
              onClick={() => artifactMutation.mutate(mode)}
            >
              <DownloadIcon />{" "}
              {artifactMutation.isPending
                ? "Gerando…"
                : "Gerar arquivo OpenCode"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {!useHebo ? (
        <section
          aria-label="Providers incluídos"
          className="grid gap-3 md:grid-cols-2"
        >
          {overview.providers.map((provider: CodingAgentProvider) => (
            <Card key={provider.id}>
              <CardHeader className="gap-2">
                <CardTitle className="flex justify-between gap-2">
                  <span>{provider.name}</span>
                  <Badge variant="secondary">
                    {provider.enabledModelCount} modelos
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {provider.baseUrl ?? "Sem Base URL — será ignorado"}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>
      ) : null}

      {artifactMutation.error ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível gerar o arquivo</AlertTitle>
          <AlertDescription>{artifactMutation.error.message}</AlertDescription>
        </Alert>
      ) : null}

      <Dialog
        open={artifact !== null}
        onOpenChange={(open) => !open && setArtifact(null)}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{artifact?.fileName}</DialogTitle>
            <DialogDescription>
              {artifact?.modelCount} entradas de modelo, sem chaves em texto
              puro.
            </DialogDescription>
          </DialogHeader>
          {artifact?.warnings.map((warning) => (
            <Alert key={warning}>
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          ))}
          <Textarea
            className="max-h-[50vh] min-h-80 font-mono text-xs"
            readOnly
            value={artifact?.content ?? ""}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (artifact)
                  void navigator.clipboard.writeText(artifact.content);
                toast.success("Config copiada.");
              }}
            >
              <CopyIcon /> Copiar
            </Button>
            <Button onClick={() => artifact && downloadArtifact(artifact)}>
              <DownloadIcon /> Baixar arquivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
