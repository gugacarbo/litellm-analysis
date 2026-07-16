import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuditPage } from "@/features/audit/audit-page";
import { auditListInputSchema } from "@/features/audit/contracts/audit";
import { auditQueries } from "@/features/audit/query/query-options";

export const Route = createFileRoute("/_protected/audit")({
  validateSearch: auditListInputSchema,
  beforeLoad: ({ context }) => {
    if (context.session.user.role !== "admin") {
      throw redirect({ to: "/" });
    }
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(auditQueries.list(deps)),
  component: AuditPage,
});
