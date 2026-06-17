import { Badge } from "@/shared/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import {
  ESTIMATED_COST_TOOLTIP,
  ESTIMATED_USAGE_TOOLTIP,
} from "@/shared/lib/spend-log-utils";

type LogEstimatedBadgesProps = {
  usageEstimated?: boolean;
  costEstimated?: boolean;
  className?: string;
};

export function LogEstimatedBadges({
  usageEstimated = false,
  costEstimated = false,
  className,
}: LogEstimatedBadgesProps) {
  if (!usageEstimated && !costEstimated) return null;

  return (
    <span className={className ?? "inline-flex flex-wrap gap-1"}>
      {usageEstimated ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground"
            >
              Uso estimado
            </Badge>
          </TooltipTrigger>
          <TooltipContent>{ESTIMATED_USAGE_TOOLTIP}</TooltipContent>
        </Tooltip>
      ) : null}
      {costEstimated ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground"
            >
              Custo estimado
            </Badge>
          </TooltipTrigger>
          <TooltipContent>{ESTIMATED_COST_TOOLTIP}</TooltipContent>
        </Tooltip>
      ) : null}
    </span>
  );
}
