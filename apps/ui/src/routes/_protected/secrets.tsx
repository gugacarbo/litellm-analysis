import { createFileRoute } from "@tanstack/react-router";
import { modelAdminQueries } from "@/features/model-admin/query/query-options";
import { SecretsPage } from "@/features/model-admin/secrets/secrets-page";

export const Route = createFileRoute("/_protected/secrets")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        modelAdminQueries.applicationSecrets(),
      ),
      context.queryClient.ensureQueryData(modelAdminQueries.providers()),
    ]),
  component: SecretsPage,
});
