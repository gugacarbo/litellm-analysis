import { cn } from "../../lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  className,
  showLabel = true,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const isIndeterminate = clampedValue === 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full bg-primary transition-all duration-300 ease-out",
            isIndeterminate && "animate-pulse",
          )}
          style={{ width: isIndeterminate ? "30%" : `${clampedValue}%` }}
        />
        {isIndeterminate && (
          <div
            className="absolute inset-y-0 h-full w-1/3 animate-[shimmer_1.5s_infinite] rounded-full bg-primary/50"
            style={{
              animation: "shimmer 1.5s infinite",
              background:
                "linear-gradient(90deg, transparent, currentColor, transparent)",
            }}
          />
        )}
      </div>
      {showLabel && !isIndeterminate && (
        <span className="min-w-[3ch] text-xs text-muted-foreground">
          {clampedValue}%
        </span>
      )}
    </div>
  );
}
