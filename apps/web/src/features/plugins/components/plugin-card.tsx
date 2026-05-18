import { Plug, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { PluginCardProps } from "../types/plugin-routing-types";

export function PluginCard({ plugin, onToggle }: PluginCardProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Plug className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">{plugin.name}</CardTitle>
          </div>
          <Switch
            checked={plugin.enabled}
            onCheckedChange={() => onToggle(plugin.id)}
          />
        </div>
        <CardDescription>
          {plugin.agentCount} agent{plugin.agentCount === 1 ? "" : "s"}
          {plugin.enabledAgentCount > 0 && (
            <> &middot; {plugin.enabledAgentCount} enabled</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="pt-2 border-t mt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => navigate(`/plugins/${plugin.id}`)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Configure
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
