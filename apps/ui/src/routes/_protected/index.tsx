import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/features/app-shell/components/page-header";

export const Route = createFileRoute("/_protected/")({
  component: ProtectedHome,
});

function ProtectedHome() {
  return (
    <section>
      <PageHeader
        title="Dashboard"
        subtitle="Your authenticated workspace is ready."
      />
    </section>
  );
}
