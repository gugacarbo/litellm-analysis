import { createFileRoute } from "@tanstack/react-router";
import { ModelSettingsPage } from "@/features/model-admin/models/model-settings-page";
import { modelAdminQueries } from "@/features/model-admin/query/query-options";

export const Route = createFileRoute("/_protected/models/$modelId/settings")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      modelAdminQueries.model(params.modelId),
    ),
  component: ModelSettingsRoute,
});

function ModelSettingsRoute() {
  const { modelId } = Route.useParams();
  const { session } = Route.useRouteContext();
  return <ModelSettingsPage modelId={modelId} role={session.user.role} />;
}
