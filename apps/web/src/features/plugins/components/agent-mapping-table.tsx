import type { InternalAgent } from "@lite-llm/contracts/agent-catalog";
import type { SystemAgentOption } from "@/shared/lib/api-client/agent-catalog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AgentMappingTableProps {
  internalAgents: InternalAgent[];
  mappings: Record<string, string>;
  systemAgents: SystemAgentOption[];
  onChange: (internalAgentId: string, systemAgentKey: string) => void;
}

export function AgentMappingTable({
  internalAgents,
  mappings,
  systemAgents,
  onChange,
}: AgentMappingTableProps) {
  if (internalAgents.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Agent Routing</h3>
      <p className="text-sm text-muted-foreground">
        Map internal agents to system agents for this plugin.
      </p>
      <div className="space-y-2">
        {internalAgents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <div className="min-w-0 flex-1 mr-3">
              <span className="text-sm font-medium">{agent.displayName}</span>
              <p className="text-xs text-muted-foreground truncate">
                {agent.description}
              </p>
            </div>
            <Select
              value={mappings[agent.id] ?? "none"}
              onValueChange={(value) =>
                onChange(agent.id, value === "none" ? "" : value)
              }
            >
              <SelectTrigger
                className="h-8 w-40"
                aria-label={`Map ${agent.displayName} to system agent`}
              >
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">None</span>
                </SelectItem>
                {systemAgents.map((sa) => (
                  <SelectItem key={sa.key} value={sa.key}>
                    {sa.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
