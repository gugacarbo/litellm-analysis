import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import type { AgentCatalogCardProps } from "./agent-catalog-types";

export function AgentCatalogCard({
  agent,
  onEdit,
  onDelete,
}: AgentCatalogCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="text-2xl"
              role="img"
              aria-label={agent.displayName}
            >
              {agent.icon}
            </span>
            <CardTitle className="text-base">{agent.displayName}</CardTitle>
          </div>
        </div>
        <CardDescription>{agent.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <span className="text-xs font-medium text-muted-foreground">
            Model
          </span>
          <p className="text-sm font-mono">{agent.model}</p>
        </div>
        {agent.enabledPlugins.length > 0 && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Plugins
            </span>
            <div className="mt-1 flex flex-wrap gap-1">
              {agent.enabledPlugins.map((plugin) => (
                <Badge key={plugin} variant="secondary" className="text-xs">
                  {plugin}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          {agent.versions.length}{" "}
          {agent.versions.length === 1 ? "version" : "versions"}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(agent)}>
          <Pencil className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(agent.id)}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
