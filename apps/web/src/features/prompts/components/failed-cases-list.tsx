import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { CaseResult } from "../types";
import { cn } from "@/shared/lib/utils";

interface FailedCasesListProps {
  cases: CaseResult[];
}

export function FailedCasesList({ cases }: FailedCasesListProps) {
  const [expanded, setExpanded] = useState(false);

  const failedCases = cases.filter((c) => !c.passed);

  if (failedCases.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">Nenhum caso falhou</p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 text-sm font-medium",
          "hover:text-foreground transition-colors",
        )}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        Casos Problemáticos ({failedCases.length})
      </button>

      {expanded && (
        <div className="space-y-2 pl-4">
          {failedCases.map((c) => {
            const missing = c.expectedCategories.filter(
              (cat) => !c.predictedCategories.includes(cat),
            );
            const extra = c.predictedCategories.filter(
              (cat) => !c.expectedCategories.includes(cat),
            );

            return (
              <div
                key={c.id}
                className="rounded-md border bg-muted/30 p-3 space-y-2"
              >
                <p className="text-xs font-mono text-muted-foreground line-clamp-2">
                  {c.input}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-muted-foreground">
                    expected:{" "}
                    <span className="text-foreground font-medium">
                      {c.expectedCategories.join(", ")}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    predicted:{" "}
                    <span className="text-foreground font-medium">
                      {c.predictedCategories.join(", ")}
                    </span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 text-xs">
                  {missing.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-red-600">
                      missing: {missing.join(", ")}
                    </span>
                  )}
                  {extra.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded bg-yellow-500/10 px-2 py-0.5 text-yellow-600">
                      extra: {extra.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
