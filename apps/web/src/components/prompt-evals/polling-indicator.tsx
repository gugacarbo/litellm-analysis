import { RefreshCw } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface PollingIndicatorProps {
  isFetching: boolean;
  className?: string;
}

export function PollingIndicator({
  isFetching,
  className,
}: PollingIndicatorProps) {
  if (!isFetching) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs text-muted-foreground",
        className,
      )}
    >
      <RefreshCw className="h-3 w-3 animate-spin" />
      <span>Atualizando...</span>
    </div>
  );
}
