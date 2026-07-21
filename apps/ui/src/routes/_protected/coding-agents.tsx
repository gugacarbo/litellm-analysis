import { createFileRoute, redirect } from "@tanstack/react-router";
import { CodingAgentsPage } from "@/features/coding-agents/coding-agents-page";
import { codingAgentsOverviewQuery } from "@/features/coding-agents/query/query-options";

export const Route = createFileRoute("/_protected/coding-agents")({
  beforeLoad: ({ context }) => {
    if (context.session.user.role !== "admin") throw redirect({ to: "/" });
  },
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(codingAgentsOverviewQuery()),
  component: CodingAgentsPage,
});
