import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
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
  // Task D owns the read-only page component. Keeping the route outlet-only
  // lets its UI attach without duplicating a page surface in this task.
  component: Outlet,
});
