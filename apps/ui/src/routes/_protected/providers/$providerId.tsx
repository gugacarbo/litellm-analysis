import { createFileRoute } from "@tanstack/react-router";
import { ProviderDetailPage } from "@/features/model-admin/providers/provider-detail-page";
import { modelAdminQueries } from "@/features/model-admin/query/query-options";

export const Route = createFileRoute("/_protected/providers/$providerId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      modelAdminQueries.provider(params.providerId),
    ),
  component: ProviderDetailRoute,
});

function ProviderDetailRoute() {
  const { providerId } = Route.useParams();
  const { session } = Route.useRouteContext();
  return (
    <ProviderDetailPage providerId={providerId} role={session.user.role} />
  );
}
