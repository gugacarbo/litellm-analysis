import { createFileRoute } from "@tanstack/react-router";
import { AliasesPage } from "@/features/model-admin/aliases/aliases-page";
import { modelAdminQueries } from "@/features/model-admin/query/query-options";

export const Route = createFileRoute("/_protected/models/aliases")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(modelAdminQueries.aliases()),
      context.queryClient.ensureQueryData(modelAdminQueries.models()),
    ]),
  component: AliasesRoute,
});

function AliasesRoute() {
  const { session } = Route.useRouteContext();
  return <AliasesPage role={session.user.role} />;
}
