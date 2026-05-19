import type { SystemAgent } from "@lite-llm/contracts/agent-routing";
import { Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

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
  const agentId = agent.id || agent.displayName;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{agent.icon}</span>
            <div>
              <CardTitle className="text-sm">{agent.displayName}</CardTitle>
              <p className="text-xs text-muted-foreground font-mono">
                {agentId}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onOpenConfig(agentId)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Agent</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the agent &quot;
                    {agent.displayName}&quot;? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(agentId)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {agent.description}
        </p>
        <div className="flex flex-wrap gap-1">
          {agent.model && (
            <Badge variant="outline" className="text-xs font-mono">
              {agent.model}
            </Badge>
          )}
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
