import type {
  AgentCatalogEntry,
  SystemAgent,
} from "@lite-llm/contracts/agent-routing";
import { useQuery } from "@tanstack/react-query";
import {
  getAgentCatalog,
  getCategoryCatalog,
} from "@/shared/lib/api-client/agent-catalog";
import { queryKeys } from "@/shared/lib/query-keys";
import { normalizeSystemAgent } from "./components/normalize";

export function useAgentRoutingState() {
  const catalogQuery = useQuery({
    queryKey: queryKeys.agentCatalog.all,
    queryFn: getAgentCatalog,
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categoryCatalog.all,
    queryFn: getCategoryCatalog,
  });

  const rawAgents: AgentCatalogEntry[] = catalogQuery.data?.agents ?? [];

  // Build map of displayName -> catalog key
  const agentKeyByDisplayName: Record<string, string> = {};
  const agents: SystemAgent[] = [];

  for (const entry of rawAgents) {
    if (entry.displayName) {
      agentKeyByDisplayName[entry.displayName] = entry.key;
      agents.push(normalizeSystemAgent(entry));
    }
  }

  return {
    agents,
    agentKeyByDisplayName,
    loading: catalogQuery.isPending && !catalogQuery.data,
    error:
      catalogQuery.error instanceof Error ? catalogQuery.error.message : null,
    categories: categoriesQuery.data ?? {},
    categoriesLoading: categoriesQuery.isPending && !categoriesQuery.data,
  };
}
