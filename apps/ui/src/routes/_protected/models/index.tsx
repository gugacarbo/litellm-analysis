import { createFileRoute } from "@tanstack/react-router";
import { ModelsPage } from "@/features/model-admin/models/models-page";
import { modelAdminQueries } from "@/features/model-admin/query/query-options";

export const Route = createFileRoute("/_protected/models/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(modelAdminQueries.models()),
  component: ModelsRoute,
});

function ModelsRoute() {
  const { session } = Route.useRouteContext();
  return <ModelsPage role={session.user.role} />;
}
