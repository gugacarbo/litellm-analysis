import { createFileRoute } from "@tanstack/react-router";
import { BenchmarksPage } from "@/features/benchmarks/benchmarks-page";
import { benchmarkListInputSchema } from "@/features/benchmarks/contracts/benchmarks";
import { benchmarkQueries } from "@/features/benchmarks/query/query-options";

export const Route = createFileRoute("/_protected/benchmarks/openrouter")({
  validateSearch: benchmarkListInputSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.prefetchQuery(benchmarkQueries.openrouter(deps)),
  component: OpenRouterRoute,
});

function OpenRouterRoute() {
  const { session } = Route.useRouteContext();
  return (
    <BenchmarksPage
      role={session.user.role}
      search={Route.useSearch()}
      source="openrouter"
    />
  );
}
