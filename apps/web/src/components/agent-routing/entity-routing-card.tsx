import type { LucideIcon } from "lucide-react";
import { UserIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export type EntityRoutingCardProps = {
  /** Icon displayed in the card header */
  icon: LucideIcon;
  /** Main title for the card */
  title: string;
  /** Optional description below the title */
  description?: string;
  /** Total number of entities (agents or categories) */
  totalCount: number;
  /** Number of entities with a configured model */
  configuredCount: number;
  /** Total number of fallback models configured */
  totalFallbacks: number;
  /** Main content (FocusView component) */
  children: ReactNode;
};

export function EntityRoutingCard({
  icon: Icon,
  title,
  description,
  totalCount,
  configuredCount,
  totalFallbacks,
  children,
}: EntityRoutingCardProps) {
  const hasFallbacks = totalFallbacks > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center flex-1 justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Icon className="size-5" />
              {title}
            </CardTitle>
            <div className="flex items-center gap-4">
              {hasFallbacks ? (
                <div className="flex items-center text-muted-foreground gap-4">
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="size-4" />
                    <span className="text-sm text-foreground">
                      <span className="font-medium">{configuredCount}</span>/
                      {totalCount} configured
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-foreground">
                      <span className="font-medium text-foreground">
                        {totalFallbacks}
                      </span>{" "}
                      fallback{totalFallbacks === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              ) : (
                <Badge variant="outline">
                  {configuredCount}/{totalCount} configured
                </Badge>
              )}
            </div>
          </div>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-6">{children}</CardContent>
      </Card>
    </div>
  );
}
