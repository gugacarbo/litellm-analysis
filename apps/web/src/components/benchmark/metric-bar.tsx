import type { ReactNode } from "react";

interface MetricBarProps {
  label: ReactNode;
  value: number | null;
  percentile: number | null; // 0-100
  formatValue?: (value: number) => string;
  color?: string;
}

export function MetricBar({
  label,
  value,
  percentile,
  formatValue = (v) => v.toFixed(1),
  color = "bg-blue-500",
}: MetricBarProps) {
  const displayValue = value !== null ? formatValue(value) : "—";
  const barPercent =
    percentile !== null ? Math.min(100, Math.max(0, percentile)) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{displayValue}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${barPercent}%` }}
        />
      </div>
    </div>
  );
}
