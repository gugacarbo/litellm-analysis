import { Bot, Brain, Code, Scale, Zap } from "lucide-react";
import type { UseCase } from "@/features/benchmarks/types/benchmark-types";

import { CHART_COLORS } from "./benchmark-colors";

interface UseCaseFilterProps {
  activeUseCase: UseCase;
  onUseCaseChange: (useCase: UseCase) => void;
  onCompareTop3: () => void;
  selectedCount: number;
  totalCount: number;
  onClearAll: () => void;
}

const USE_CASES: { value: UseCase; label: string; icon: React.ReactNode }[] = [
  {
    value: "intelligence",
    label: "Intelligence",
    icon: <Brain className="h-3 w-3" />,
  },
  { value: "coding", label: "Coding", icon: <Code className="h-3 w-3" /> },
  { value: "agentic", label: "Agentic", icon: <Bot className="h-3 w-3" /> },
  {
    value: "fastAndCheap",
    label: "Fast & Cheap",
    icon: <Zap className="h-3 w-3" />,
  },
  { value: "balanced", label: "Balanced", icon: <Scale className="h-3 w-3" /> },
];

export function UseCaseFilter({
  activeUseCase,
  onUseCaseChange,
  onCompareTop3,
  selectedCount,
  totalCount,
  onClearAll,
}: UseCaseFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-1.5">
        {USE_CASES.map((uc) => (
          <button
            key={uc.value}
            type="button"
            onClick={() => onUseCaseChange(uc.value)}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
              activeUseCase === uc.value
                ? "text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
            style={
              activeUseCase === uc.value
                ? { backgroundColor: CHART_COLORS[uc.value] }
                : undefined
            }
          >
            {uc.icon}
            {uc.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <span className="text-xs text-muted-foreground">
          {selectedCount > 0
            ? `Comparing ${selectedCount} model${selectedCount !== 1 ? "s" : ""}`
            : `Showing top ${totalCount} by ${activeUseCase}`}
        </span>
        <button
          type="button"
          onClick={onCompareTop3}
          className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Compare top 3
        </button>
        {selectedCount > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

