import { FeatureGate } from "../components/feature-gate";
import { UnavailableFeature } from "../components/unavailable-feature";
import { ErrorsContent } from "./errors-content";

export function ErrorsPage() {
  return (
    <FeatureGate
      capability="errorLogs"
      fallback={<UnavailableFeature capability="errorLogs" />}
    >
      <ErrorsContent />
    </FeatureGate>
  );
}
