import type { ModelBenchmarkListItem } from "@lite-llm/api-contracts";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface RawBenchmarkGridProps {
  model: ModelBenchmarkListItem;
}

const BENCHMARK_CONFIG = [
  { key: "mmluPro", label: "MMLU-Pro" },
  { key: "gpqa", label: "GPQA" },
  { key: "hle", label: "HLE" },
  { key: "livecodebench", label: "LiveCode" },
  { key: "scicode", label: "SciCode" },
  { key: "math500", label: "MATH-500" },
  { key: "aime", label: "AIME" },
  { key: "aime25", label: "AIME-2025" },
  { key: "tau2", label: "TAU2" },
  { key: "ifbench", label: "IfBench" },
  { key: "lcr", label: "LCR" },
  { key: "terminalbenchHard", label: "Terminal" },
] as const;

function formatRawValue(value: number | null): string {
  if (value === null) return "\u2014";
  if (value > 100) return value.toFixed(0);
  return value.toFixed(1);
}

export function RawBenchmarkGrid({ model }: RawBenchmarkGridProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
        {expanded ? "Hide" : "Show"} raw benchmarks
      </button>

      {expanded && (
        <div className="grid grid-cols-3 gap-2">
          {BENCHMARK_CONFIG.map((bench) => {
            const value = model[bench.key as keyof ModelBenchmarkListItem] as
              | number
              | null;
            return (
              <div
                key={bench.key}
                className="flex flex-col rounded-md bg-muted/50 px-2 py-1.5"
              >
                <span className="text-[10px] text-muted-foreground truncate">
                  {bench.label}
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {formatRawValue(value)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
