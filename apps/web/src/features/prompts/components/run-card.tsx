import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import type { CaseResult, EvalRunDetail } from "../types";
import {
  formatDuration,
  formatPrecision,
  formatRelativeTime,
  statusVariant,
} from "../utils";
import { CategoryTable } from "./category-table";
import { FailedCasesList } from "./failed-cases-list";
import { ProgressBar } from "./progress-bar";

interface RunCardProps {
  detail: EvalRunDetail;
  loading?: boolean;
  onCancel?: () => void;
  isCancelling?: boolean;
  onOpenDetails?: () => void;
}

export function RunCard({
  detail,
  loading: _loading,
  onCancel,
  isCancelling,
  onOpenDetails,
}: RunCardProps) {
  const [expanded, setExpanded] = useState(true);
  const isTerminal = ["succeeded", "failed", "cancelled"].includes(
    detail.status,
  );
  const progressPct = detail.progressPct ?? (isTerminal ? 100 : 0);
  const scorePct =
    detail.status === "succeeded" && detail.macroF1 !== null
      ? Math.round(detail.macroF1 * 100)
      : null;
  const headerBarValue = scorePct ?? progressPct;
  const headerBarLabel = scorePct !== null ? `F1 ${scorePct}%` : undefined;

  const categories = detail.categories ?? [];
  const cases: CaseResult[] = detail.cases ?? [];
  const failedCount = cases.filter((item) => !item.passed).length;
  const hasDetailData = detail.steps.length > 0 || categories.length > 0;
  const passedCategories = categories.filter(
    (item) => item.f1 !== null && item.f1 >= detail.threshold,
  ).length;

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-4 p-4">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex flex-1 min-w-0 items-center gap-3 text-left transition-colors hover:text-foreground"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm truncate">{detail.model}</span>
              <Badge variant={statusVariant(detail.status)}>
                {detail.status}
              </Badge>
            </div>
            <div className="mt-1">
              <ProgressBar
                value={headerBarValue}
                showLabel
                className="max-w-md"
              />
              {headerBarLabel && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {headerBarLabel}
                </p>
              )}
            </div>
          </div>

          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{formatRelativeTime(detail.startedAt)}</span>
          {detail.macroF1 !== null && (
            <span className="hidden sm:inline">
              F1 {formatPrecision(detail.macroF1, 3)}
            </span>
          )}
          {categories.length > 0 && (
            <span className="hidden sm:inline">
              {categories.length} categorias
            </span>
          )}
          {cases.length > 0 && (
            <span className="hidden sm:inline">{failedCount} falhas</span>
          )}
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
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          {onOpenDetails && (
            <Button variant="secondary" size="sm" onClick={onOpenDetails}>
              Ver detalhes
            </Button>
          )}
        </div>
      </div>

      {/* Content - expandível */}
      {expanded && (
        <div className="border-t px-4 pb-4 space-y-4">
          <div className="grid gap-2 pt-3 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
            <p>
              Threshold:{" "}
              <span className="font-mono text-foreground">
                {detail.threshold}
              </span>
            </p>
            <p>
              Duração:{" "}
              <span className="font-mono text-foreground">
                {formatDuration(detail.startedAt, detail.finishedAt)}
              </span>
            </p>
            <p>
              Steps:{" "}
              <span className="font-mono text-foreground">
                {detail.steps.length}
              </span>
            </p>
            <p>
              Categorias aprovadas:{" "}
              <span className="font-mono text-foreground">
                {passedCategories}/{categories.length}
              </span>
            </p>
          </div>

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

          {hasDetailData ? (
            <>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Métricas por Categoria</h4>
                <CategoryTable categories={categories} />
              </div>
              <div className="space-y-2">
                <FailedCasesList cases={cases} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-1">
              Abra "Ver detalhes" para carregar métricas completas deste run.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
