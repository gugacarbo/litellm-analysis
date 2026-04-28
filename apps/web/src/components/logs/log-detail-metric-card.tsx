import type { DollarSign } from "lucide-react";

type MetricCardProps = {
  icon: typeof DollarSign;
  label: string;
  value: string;
  accent: string;
};

export function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
}: MetricCardProps) {
  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${accent}`} />
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
