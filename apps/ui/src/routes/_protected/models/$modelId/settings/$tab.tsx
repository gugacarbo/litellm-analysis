import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_protected/models/$modelId/settings/$tab",
)({
  component: () => null,
});
