import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/benchmarks/")({
  beforeLoad: () => {
    throw redirect({ to: "/benchmarks/aa" });
  },
});
