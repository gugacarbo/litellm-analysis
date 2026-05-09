import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";
import { useQuery } from "@tanstack/react-query";
import { normalizeSystemAgent } from "../../components/agent-config-editor/normalize";
import { getAgentCatalog } from "../../lib/api-client/agent-catalog";
import { queryKeys } from "../../lib/query-keys";

export function useAgentRoutingState() {
  const catalogQuery = useQuery({
    queryKey: queryKeys.agentCatalog.all,
    queryFn: getAgentCatalog,
  });

  const rawAgents: unknown[] = catalogQuery.data?.agents ?? [];
  const agents: SystemAgent[] = rawAgents
    .filter(
      (agent): agent is Partial<SystemAgent> & { id: string } =>
        typeof agent === "object" &&
        agent !== null &&
        "id" in agent &&
        typeof agent.id === "string" &&
        agent.id.length > 0,
    )
    .map((agent) => normalizeSystemAgent(agent));

  return {
    agents,
    loading: catalogQuery.isPending && !catalogQuery.data,
    error:
      catalogQuery.error instanceof Error ? catalogQuery.error.message : null,
  };
}
