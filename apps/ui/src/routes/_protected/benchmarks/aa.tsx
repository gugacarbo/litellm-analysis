import { createFileRoute } from "@tanstack/react-router";
import { BenchmarksPage } from "@/features/benchmarks/benchmarks-page";
import { benchmarkListInputSchema } from "@/features/benchmarks/contracts/benchmarks";
import { benchmarkQueries } from "@/features/benchmarks/query/query-options";

export const Route = createFileRoute("/_protected/benchmarks/aa")({
  validateSearch: benchmarkListInputSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.prefetchQuery(benchmarkQueries.aa(deps)),
  component: AaRoute,
});

function AaRoute() {
  const { session } = Route.useRouteContext();
  return (
    <BenchmarksPage
      role={session.user.role}
      search={Route.useSearch()}
      source="aa"
    />
  );
}
