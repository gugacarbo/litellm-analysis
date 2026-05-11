import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type EntityFocusCardProps = {
  agent: SystemAgent;
  onOpenConfig: (id: string) => void;
  onDelete: (id: string) => void;
};

export function EntityFocusCard({
  agent,
  onOpenConfig,
  onDelete,
}: EntityFocusCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{agent.icon}</span>
            <div>
              <CardTitle className="text-sm">{agent.displayName}</CardTitle>
              <p className="text-xs text-muted-foreground font-mono">
                {agent.id}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onOpenConfig(agent.id)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => onDelete(agent.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {agent.description}
        </p>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {agent.limits.context.toLocaleString()} ctx
          </Badge>
          {agent.config.mode && (
            <Badge variant="secondary" className="text-xs">
              {agent.config.mode}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
