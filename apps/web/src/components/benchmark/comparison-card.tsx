import { Badge } from "@/components/ui/badge";
import type {
  ComparisonCardData,
  UseCase,
} from "@/pages/benchmarks/benchmark-types";
import {
  formatBenchmarkPrice,
  formatLatencySeconds,
  formatSpeed,
  formatValueScore,
} from "@/pages/benchmarks/benchmark-utils";
import { DataCoverageBar } from "./data-coverage-bar";
import { MetricBar } from "./metric-bar";
import { MiniRadarChart } from "./mini-radar-chart";
import { RankingList } from "./ranking-list";
import { RawBenchmarkGrid } from "./raw-benchmark-grid";

const CHART_COLORS: Record<UseCase, string> = {
  intelligence: "#2563eb",
  coding: "#059669",
  agentic: "#7c3aed",
  fastAndCheap: "#d97706",
  balanced: "#0f766e",
};

const CORE_METRICS = [
  { key: "intelligenceIndex", label: "Intelligence", color: "bg-blue-500" },
  { key: "codingIndex", label: "Coding", color: "bg-emerald-500" },
  { key: "mathIndex", label: "Math", color: "bg-amber-500" },
  { key: "agenticIndex", label: "Agentic", color: "bg-purple-500" },
] as const;

interface ComparisonCardProps {
  card: ComparisonCardData;
  activeUseCase: UseCase;
  isSelected: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

function getRankDisplay(
  rank: ComparisonCardData["rank"],
  useCase: UseCase,
): number | null {
  const rankKeyMap: Partial<Record<UseCase, keyof ComparisonCardData["rank"]>> =
    {
      intelligence: "intelligence",
      coding: "coding",
      agentic: "agentic",
      fastAndCheap: "value",
      balanced: "value",
    };
  const key = rankKeyMap[useCase];
  if (!key) return null;
  return rank[key] ?? null;
}

export function ComparisonCard({
  card,
  activeUseCase,
  isSelected,
}: ComparisonCardProps) {
  const {
    model,
    agentic,
    value,
    compositeScore,
    percentiles,
    rank,
    coverageCount,
    totalBenchmarks,
  } = card;
  const borderColor = isSelected
    ? CHART_COLORS[activeUseCase]
    : "border-border";
  const cardColor = CHART_COLORS[activeUseCase];
  const rankDisplay = getRankDisplay(rank, activeUseCase);

  return (
    <div
      className={`w-[320px] flex-shrink-0 rounded-lg border-2 bg-card p-4 space-y-4 flex flex-col ${borderColor}`}
    >
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{model.name}</h3>
            <p className="text-xs text-muted-foreground">{model.creatorName}</p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {rankDisplay !== null
                ? `#${rankDisplay} ${activeUseCase}`
                : `- ${activeUseCase}`}
            </Badge>
            {model.isConfigured && (
              <Badge variant="success" className="text-[10px] px-1.5 py-0">
                Configured
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Mini Radar */}
      <MiniRadarChart percentiles={percentiles} color={cardColor} />

      {/* Overall Score */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Overall Score</span>
          <span className="font-semibold tabular-nums">
            {compositeScore.toFixed(1)}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${getScoreColor(compositeScore)}`}
            style={{ width: `${Math.min(100, compositeScore)}%` }}
          />
        </div>
      </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {CORE_METRICS.map((m) => {
          const modelValue =
            m.key === "agenticIndex"
              ? agentic.agenticIndex
              : (model[m.key as keyof typeof model] as number | null);
          const pct =
            m.key === "agenticIndex"
              ? percentiles.get("agenticIndex")
              : percentiles.get(m.key);
          return (
            <MetricBar
              key={m.key}
              label={m.label}
              value={modelValue}
              percentile={pct ?? null}
              formatValue={(v) => v.toFixed(1)}
              color={m.color}
            />
          );
        })}
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="space-y-0.5">
          <p className="text-[10px] text-muted-foreground">Speed</p>
          <p className="text-xs font-medium tabular-nums">
            {formatSpeed(model.medianOutputTokensPerSecond)}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] text-muted-foreground">Latency</p>
          <p className="text-xs font-medium tabular-nums">
            {formatLatencySeconds(model.medianTimeToFirstTokenSeconds)}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] text-muted-foreground">Price</p>
          <p className="text-xs font-medium tabular-nums">
            {formatBenchmarkPrice(model.priceBlended1mTokens)}
          </p>
        </div>
      </div>

      {/* Value Analysis */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground font-medium">
          Value per USD
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground">Intel/$</p>
            <p className="text-xs font-medium tabular-nums">
              {formatValueScore(value.intelligencePerDollar)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground">Speed/$</p>
            <p className="text-xs font-medium tabular-nums">
              {formatValueScore(value.speedPerDollar)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground">Agent/$</p>
            <p className="text-xs font-medium tabular-nums">
              {formatValueScore(value.agenticPerDollar)}
            </p>
          </div>
        </div>
      </div>

      {/* Rankings */}
      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground font-medium">
          Rankings
        </p>
        <RankingList rank={rank} topN={4} />
      </div>

      {/* Raw Benchmarks */}
      <RawBenchmarkGrid model={model} />

      {/* Coverage */}
      <DataCoverageBar count={coverageCount} total={totalBenchmarks} />
    </div>
  );
}
