import { Lock, Plug, Unlock } from "lucide-react";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Switch } from "../ui/switch";
import type { PluginCardProps } from "./plugin-routing-types";

export function PluginCard({
  plugin,
  onToggle,
  onToggleAgent,
  agentNames,
  enabledAgentIds,
}: PluginCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Plug className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">{plugin.name}</CardTitle>
            <Badge variant={plugin.builtin ? "secondary" : "outline"}>
              {plugin.builtin ? "Built-in" : "External"}
            </Badge>
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
      <CardContent className="space-y-4">
        {plugin.enabled ? (
          agentNames && agentNames.length > 0 ? (
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">
                Agent Routing
              </span>
              <div className="space-y-2">
                {agentNames.map((agentName) => {
                  const isEnabled = enabledAgentIds?.includes(agentName) ?? false;
                  return (
                    <div
                      key={agentName}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <span className="text-sm">{agentName}</span>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() =>
                          onToggleAgent(plugin.id, agentName)
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Unlock className="h-4 w-4" />
              <span>No agents available for routing.</span>
            </div>
          )
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Enable this plugin to configure agent routing.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
