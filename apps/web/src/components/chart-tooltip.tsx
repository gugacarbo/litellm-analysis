type ChartTooltipEntry = {
  color?: string;
  name?: string | number;
  value?: number | string;
};

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: ChartTooltipEntry[];
  label?: string | number;
  formatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  formatter = (v) => String(v),
  labelFormatter = (l) => l,
}: ChartTooltipContentProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <p className="text-sm font-medium text-foreground">
        {labelFormatter(label as string)}
      </p>
      <div className="mt-1 space-y-0.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">
              {formatter(entry.value as number)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
