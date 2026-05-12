import { cn } from "../../lib/utils";
import {
  formatPrecision,
  getScoreStroke,
} from "../../pages/prompt-evals/utils";

interface ScoreGaugeProps {
  value: number | null;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ScoreGauge({
  value,
  size = 80,
  strokeWidth = 6,
  className,
}: ScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  // 180° arc (semicircle) instead of full circle
  const circumference = Math.PI * radius;
  const normalizedValue = value ?? 0;
  const strokeDashoffset = circumference - normalizedValue * circumference;
  const stroke = getScoreStroke(value);

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
    >
      <svg
        width={size}
        height={size / 2}
        viewBox={`0 0 ${size} ${size / 2}`}
        className="overflow-visible"
        role="img"
        aria-label={`Score: ${formatPrecision(value)}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
          strokeDasharray={`${circumference / 2} ${circumference / 2}`}
          strokeDashoffset={0}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span
        className="absolute text-sm font-mono font-medium"
        style={{ color: stroke }}
      >
        {formatPrecision(value)}
      </span>
    </div>
  );
}
