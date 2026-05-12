import type { InternalAgent } from "@lite-llm/api-contracts/agent-catalog";

interface SystemAgentOption {
  key: string;
  displayName: string;
}

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
            <select
              aria-label={`Map ${agent.displayName} to system agent`}
              value={mappings[agent.id] ?? ""}
              onChange={(e) => onChange(agent.id, e.target.value)}
              className="h-8 w-40 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">None</option>
              {systemAgents.map((sa) => (
                <option key={sa.key} value={sa.key}>
                  {sa.displayName}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
