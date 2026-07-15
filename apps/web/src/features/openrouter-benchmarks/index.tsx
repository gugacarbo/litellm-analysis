import { useQuery } from "@tanstack/react-query";
import { getOpenRouterBenchmarks } from "@/shared/lib/api-client/openrouter-benchmarks";

export function OpenRouterBenchmarksPage() {
  const query = useQuery({ queryKey: ["openrouter-benchmarks", "read-only"], queryFn: () => getOpenRouterBenchmarks({ page: 1, pageSize: 100 }) });
  return <div><h1>OpenRouter benchmarks</h1><p>This deprecated surface is read-only. Sync benchmarks in apps/ui.</p>{query.isPending ? <p>Loading benchmarks…</p> : null}<ul>{(query.data?.models ?? []).map((model) => <li key={model.id}>{model.name}</li>)}</ul></div>;
}
