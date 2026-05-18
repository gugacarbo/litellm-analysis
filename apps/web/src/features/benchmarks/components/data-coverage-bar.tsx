interface DataCoverageBarProps {
  count: number;
  total: number;
}

export function DataCoverageBar({ count, total }: DataCoverageBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const isLow = percentage < 50;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Coverage</span>
        <span className={isLow ? "text-amber-500" : ""}>
          {count}/{total} benchmarks
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isLow ? "bg-amber-500" : "bg-emerald-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
