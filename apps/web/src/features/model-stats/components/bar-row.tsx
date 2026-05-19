import { Link } from "react-router-dom";

type BarRowProps = {
  label: string;
  value: number;
  formatted: string;
  max: number;
  color: string;
  href?: string;
  disabled?: boolean;
};

export function BarRow({
  label,
  value,
  formatted,
  max,
  color,
  href,
  disabled,
}: BarRowProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        {href ? (
          <Link
            to={href}
            className={`font-mono text-xs hover:underline truncate max-w-[60%] ${disabled ? "opacity-50" : ""}`}
          >
            {label || "(no model)"}
          </Link>
        ) : (
          <span className="font-mono text-xs truncate max-w-[60%]">
            {label || "(no model)"}
          </span>
        )}
        <span className="text-muted-foreground tabular-nums">{formatted}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
