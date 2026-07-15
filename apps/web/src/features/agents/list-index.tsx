import { useQuery } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { PageLayout } from "@/shared/components/ui/page-layout";
import {
  getAgentCatalog,
  getCategoryCatalog,
} from "@/shared/lib/api-client/agent-catalog";

export function AgentsPage() {
  const agents = useQuery({
    queryKey: ["agent-catalog"],
    queryFn: getAgentCatalog,
  });
  const categories = useQuery({
    queryKey: ["category-catalog"],
    queryFn: getCategoryCatalog,
  });
  return (
    <PageLayout
      title="Agents"
      icon={Settings}
      subtitle="This deprecated surface is read-only. Manage agents and categories in apps/ui."
    >
      <section className="space-y-3">
        <h2 className="font-semibold">Agents</h2>
        {agents.isPending ? (
          <p>Loading agents…</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {(agents.data?.agents ?? []).map((agent) => (
              <li key={agent.key}>{agent.displayName ?? agent.key}</li>
            ))}
          </ul>
        )}
      </section>
      <section className="mt-6 space-y-3">
        <h2 className="font-semibold">Categories</h2>
        {categories.isPending ? (
          <p>Loading categories…</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {Object.keys(categories.data ?? {}).map((key) => (
              <li key={key}>{key}</li>
            ))}
          </ul>
        )}
      </section>
    </PageLayout>
  );
}
