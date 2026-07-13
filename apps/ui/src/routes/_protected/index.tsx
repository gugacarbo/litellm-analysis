import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/")({
  component: ProtectedHome,
});

function ProtectedHome() {
  return (
    <section className="p-8">
      <h1 className="text-4xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Your authenticated workspace is ready.
      </p>
    </section>
  );
}
