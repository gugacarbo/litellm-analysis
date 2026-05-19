import type { ComparisonCardData } from "@/features/benchmarks/types/benchmark-types";

interface RankingListProps {
  rank: ComparisonCardData["rank"];
  topN?: number;
}

const RANK_LABELS: Record<keyof ComparisonCardData["rank"], string> = {
  intelligence: "Intel",
  coding: "Code",
  math: "Math",
  agentic: "Agent",
  speed: "Speed",
  price: "Price",
  value: "Value",
};

export function RankingList({ rank, topN = 3 }: RankingListProps) {
  const entries = (Object.entries(rank) as [keyof typeof rank, number][])
    .filter(([, value]) => value > 0)
    .sort((a, b) => a[1] - b[1])
    .slice(0, topN);

  if (entries.length === 0) {
    return <span className="text-xs text-muted-foreground">No rankings</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([key, value]) => (
        <span
          key={key}
          className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium"
        >
          #{value} {RANK_LABELS[key]}
        </span>
      ))}
    </div>
  );
}
