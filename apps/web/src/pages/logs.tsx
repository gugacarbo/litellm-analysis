import { FileText } from "lucide-react";
import { PageLayout } from "@/shared/components/ui/page-layout";

export function LogsPage() {
  return (
    <PageLayout
      title="Request Logs"
      subtitle="Detailed LLM request history with filters and pagination"
      icon={FileText}
    >
      <p>Logs page coming soon...</p>
    </PageLayout>
  );
}
