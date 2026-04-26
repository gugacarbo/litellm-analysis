import type { ReactNode } from "react";
import { useServerMode } from "../hooks/use-server-mode";
import type { AnalyticsCapabilities } from "../types/analytics";
import { UnavailableFeature } from "./unavailable-feature";

interface FeatureGateProps {
  capability: keyof AnalyticsCapabilities;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({
  capability,
  children,
  fallback,
}: FeatureGateProps) {
  const { capabilities } = useServerMode();

  if (capabilities[capability]) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return <UnavailableFeature capability={capability} />;
}
