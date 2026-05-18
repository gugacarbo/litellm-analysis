import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { PageLayout } from "../../components/ui/page-layout";
import { Textarea } from "../../components/ui/textarea";
import { ModelSelect } from "./components/model-select";
import { PollingIndicator } from "./components/polling-indicator";
import { RunCard } from "./components/run-card";
import { usePromptEvalsPage } from "./use-prompt-evals-page";

export function PromptEvalsPage() {
  const {
    form,
    setForm,
    casesText,
    setCasesText,
    parsedCases,
    casesError,
    runsLoading,
    runsError,
    sortedRuns,
    total,
    startEval,
    isStarting,
    startError,
    cancelEval,
    isCancelling,
    models,
    modelsLoading,
  } = usePromptEvalsPage();
  const navigate = useNavigate();

  // Keyboard navigation state
  const runsRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!sortedRuns.length) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev === null ? 0 : Math.min(prev + 1, sortedRuns.length - 1),
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev === null ? sortedRuns.length - 1 : Math.max(prev - 1, 0),
          );
          break;
        case "Enter":
          if (selectedIndex !== null) {
            navigate(`/prompt-evals/${sortedRuns[selectedIndex].id}`);
          }
          break;
        case "Escape":
          setSelectedIndex(null);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, sortedRuns, selectedIndex]);

  // Verificar se há runs em andamento
  const hasActiveRuns = sortedRuns.some(
    (run) => !["succeeded", "failed", "cancelled"].includes(run.status),
  );

  return (
    <PageLayout
      title="Prompt Evals"
      subtitle="Evaluate category classification accuracy"
      buttons={
        hasActiveRuns && !runsLoading ? (
          <PollingIndicator isFetching={runsLoading} />
        ) : undefined
      }
    >
      {/* New Run Form */}
      <div className="mb-6 flex gap-4 items-end rounded-lg border bg-card p-4">
        <div className="flex-1">
          <Label className="mb-2">Model</Label>
          {modelsLoading ? (
            <Input disabled placeholder="Carregando modelos..." />
          ) : (
            <ModelSelect
              models={models}
              value={form.model}
              onChange={(model) => setForm({ ...form, model })}
              placeholder="Selecione um modelo..."
            />
          )}
        </div>
        <div className="w-32">
          <Label className="mb-2">Threshold</Label>
          <Input
            type="number"
            step={0.05}
            min={0}
            max={1}
            value={form.threshold}
            onChange={(e) =>
              setForm({
                ...form,
                threshold: parseFloat(e.target.value) || 0.8,
              })
            }
          />
        </div>
        <Button
          onClick={() =>
            startEval({
              model: form.model,
              threshold: form.threshold,
              cases: parsedCases,
            })
          }
          disabled={
            isStarting ||
            !form.model ||
            parsedCases.length === 0 ||
            !!casesError
          }
        >
          {isStarting ? "Starting..." : "Run Eval"}
        </Button>
      </div>
      <div className="mb-6 rounded-lg border bg-card p-4">
        <Label className="mb-2">Eval Cases (JSON)</Label>
        <Textarea
          value={casesText}
          onChange={(event) => setCasesText(event.target.value)}
          rows={12}
          className="font-mono text-xs"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Formato: array de objetos com {"{id, input, expectedCategories[]}"}.
          Casos válidos: {parsedCases.length}.
        </p>
        {casesError ? (
          <p className="mt-1 text-xs text-destructive">{casesError}</p>
        ) : null}
      </div>
      {startError ? (
        <p className="mb-6 text-sm text-destructive">{startError.message}</p>
      ) : null}

      {/* Run Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">History ({total})</h2>
          <PollingIndicator isFetching={runsLoading} />
        </div>

        {runsLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : runsError ? (
          <p className="text-destructive">Failed to load runs</p>
        ) : sortedRuns.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            Nenhum eval encontrado. Execute o primeiro eval acima.
          </p>
        ) : (
          <div ref={runsRef} className="space-y-4" tabIndex={-1}>
            {sortedRuns.map((run) => (
              <RunCard
                key={run.id}
                detail={{
                  id: run.id,
                  type: run.type,
                  threshold: run.threshold,
                  model: run.model,
                  status: run.status,
                  macroF1: run.macroF1,
                  startedAt: run.startedAt,
                  finishedAt: run.finishedAt,
                  error: run.error ?? null,
                  progressPct: run.progressPct,
                  steps: [],
                  categories: undefined,
                  cases: undefined,
                }}
                onCancel={() => cancelEval(run.id)}
                isCancelling={isCancelling}
                onOpenDetails={() => navigate(`/prompt-evals/${run.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
