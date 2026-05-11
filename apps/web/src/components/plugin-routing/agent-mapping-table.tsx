import type { InternalAgent } from "@lite-llm/api-contracts/agent-catalog";

interface AgentMappingTableProps {
  internalAgents: InternalAgent[];
  mappings: Record<string, string>;
  onChange: (agentId: string, internalAgentId: string) => void;
}

export function AgentMappingTable({ internalAgents }: AgentMappingTableProps) {
  if (internalAgents.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Agent Routing</h3>
      <p className="text-sm text-muted-foreground">
        Internal agents defined by this plugin.
      </p>
      <div className="space-y-2">
        {internalAgents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <div>
              <span className="text-sm font-medium">{agent.displayName}</span>
              <p className="text-xs text-muted-foreground">
                {agent.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
