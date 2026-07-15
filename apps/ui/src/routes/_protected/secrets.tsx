import { createFileRoute } from "@tanstack/react-router";
import { modelAdminQueries } from "@/features/model-admin/query/query-options";
import { SecretsPage } from "@/features/model-admin/secrets/secrets-page";

export const Route = createFileRoute("/_protected/secrets")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(modelAdminQueries.applicationSecrets()),
  component: SecretsPage,
});
