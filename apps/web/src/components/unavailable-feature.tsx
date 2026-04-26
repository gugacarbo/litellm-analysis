import { AlertTriangle } from "lucide-react";

const CAPABILITY_DESCRIPTIONS: Record<string, string> = {
  errorLogs: "Error logs require direct database access.",
  detailedLatency: "Detailed latency metrics require direct database access.",
  modelManagement: "Model management requires direct database access.",
  logMerge: "Log merge requires direct database access.",
  hourlyPatterns: "Hourly usage patterns require direct database access.",
};

interface UnavailableFeatureProps {
  capability: string;
  className?: string;
}

export function UnavailableFeature({ capability }: UnavailableFeatureProps) {
  const description =
    CAPABILITY_DESCRIPTIONS[capability] ??
    "This feature requires direct database access.";

  return (
    <div
      className={
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-muted-foreground/25 bg-muted/50 px-6 py-12 text-center"
      }
    >
      <AlertTriangle className="h-10 w-10 text-muted-foreground/50" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground">
          Feature Unavailable
        </p>
        <p className="text-sm text-muted-foreground/70">{description}</p>
      </div>
    </div>
  );
}
