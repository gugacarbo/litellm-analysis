import { createFileRoute } from "@tanstack/react-router";

import { ProvidersPage } from "@/features/model-admin/providers/providers-page";
import { modelAdminQueries } from "@/features/model-admin/query/query-options";

export const Route = createFileRoute("/_protected/providers")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(modelAdminQueries.providers()),
  component: ProvidersRoute,
});

function ProvidersRoute() {
  const { session } = Route.useRouteContext();
  return <ProvidersPage role={session.user.role} />;
}
