import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import type {
  CaseResult,
  CategoryMetrics,
  EvalRunDetail,
} from "../../pages/prompt-evals/types";
import {
  formatDuration,
  formatRelativeTime,
  statusVariant,
} from "../../pages/prompt-evals/utils";
import { CategoryTable } from "./category-table";
import { FailedCasesList } from "./failed-cases-list";
import { ProgressBar } from "./progress-bar";
import { ScoreGauge } from "./score-gauge";

interface RunCardProps {
  detail: EvalRunDetail;
  loading?: boolean;
  onCancel?: () => void;
  isCancelling?: boolean;
}

export function RunCard({
  detail,
  loading: _loading,
  onCancel,
  isCancelling,
}: RunCardProps) {
  const [expanded, setExpanded] = useState(true);
  const isTerminal = ["succeeded", "failed", "cancelled"].includes(
    detail.status,
  );
  const progressPct = detail.progressPct ?? (isTerminal ? 100 : 0);

  // Mock data para categories e cases (substituir quando API suportar)
  const categories: CategoryMetrics[] = detail.categories ?? [
    {
      category: "coding",
      precision: 0.92,
      recall: 0.88,
      f1: 0.9,
      totalCases: 50,
      matchedCases: 45,
    },
    {
      category: "analysis",
      precision: 0.78,
      recall: 0.85,
      f1: 0.81,
      totalCases: 15,
      matchedCases: 12,
    },
  ];

  const cases: CaseResult[] = detail.cases ?? [];

  return (
    <div className="rounded-lg border bg-card">
      {/* Header - sempre visível */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 p-4 hover:bg-muted/30 transition-colors text-left"
      >
        <ScoreGauge value={detail.macroF1} size={64} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm truncate">{detail.model}</span>
            <Badge variant={statusVariant(detail.status)}>
              {detail.status}
            </Badge>
          </div>
          <div className="mt-1">
            <ProgressBar value={progressPct} showLabel={!isTerminal} />
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{formatRelativeTime(detail.startedAt)}</span>
          {!isTerminal && (
            <span className="text-xs">
              {formatDuration(detail.startedAt, detail.finishedAt)}
            </span>
          )}
          {!isTerminal && onCancel && (
            <Button
              variant="outline"
              size="sm"
              disabled={isCancelling}
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
            >
              Cancel
            </Button>
          )}
        </div>

        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Content - expandível */}
      {expanded && (
        <div className="border-t px-4 pb-4 space-y-4">
          {detail.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {detail.error}
            </div>
          )}

          {/* Steps Timeline */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Steps</h4>
            <div className="flex flex-wrap gap-2">
              {detail.steps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                >
                  <Badge
                    variant={statusVariant(step.status)}
                    className="text-[10px] px-1.5"
                  >
                    {step.status}
                  </Badge>
                  <span className="font-mono">{step.step}</span>
                  {step.progressPct !== undefined && step.progressPct > 0 && (
                    <span className="text-muted-foreground">
                      {step.progressPct}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Category Metrics */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Métricas por Categoria</h4>
            <CategoryTable categories={categories} />
          </div>

          {/* Failed Cases */}
          <div className="space-y-2">
            <FailedCasesList cases={cases} />
          </div>
        </div>
      )}
    </div>
  );
}
