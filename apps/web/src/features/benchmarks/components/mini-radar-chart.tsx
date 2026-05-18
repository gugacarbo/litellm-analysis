import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import type { PercentileMap } from "@/features/benchmarks/types/benchmark-types";

interface MiniRadarChartProps {
  percentiles: PercentileMap;
  color?: string;
}

const RADAR_METRICS = [
  { key: "intelligenceIndex", label: "Intel" },
  { key: "codingIndex", label: "Code" },
  { key: "mathIndex", label: "Math" },
  { key: "agenticIndex", label: "Agent" },
  { key: "medianOutputTokensPerSecond", label: "Speed" },
] as const;

export function MiniRadarChart({
  percentiles,
  color = "#2563eb",
}: MiniRadarChartProps) {
  const data = RADAR_METRICS.map((m) => ({
    metric: m.label,
    value: percentiles.get(m.key) ?? 0,
  }));

  return (
    <div className="h-[120px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
          />
          <Radar
            name="Model"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.25}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
