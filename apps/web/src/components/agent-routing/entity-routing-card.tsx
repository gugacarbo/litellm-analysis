import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type EntityRoutingCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  totalCount: number;
  configuredCount: number;
  children: ReactNode;
};

export function EntityRoutingCard({
  icon: Icon,
  title,
  totalCount,
  configuredCount,
  children,
}: EntityRoutingCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">{title}</CardTitle>
          <span className="text-sm text-muted-foreground">
            ({configuredCount}/{totalCount})
          </span>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
