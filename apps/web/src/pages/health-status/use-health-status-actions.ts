import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { runHealthCheck } from "../../lib/api-client/health-check";
import { queryKeys } from "../../lib/query-keys";

export type HealthStatusTab = "status" | "history" | "summary";

interface UseHealthStatusActionsResult {
  triggerRun: (models?: string[]) => void;
  triggerSingleRun: (modelName: string) => void;
  isRunning: boolean;
  runningModel: string | null;
  activeTab: HealthStatusTab;
  setActiveTab: (tab: HealthStatusTab) => void;
}

export function useHealthStatusActions(): UseHealthStatusActionsResult {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<HealthStatusTab>("status");

  const runMutation = useMutation({
    mutationFn: (models?: string[]) => runHealthCheck(models),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.healthCheckLatest,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.healthCheckSummary,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.healthCheckResults({ limit: 50, offset: 0 }),
      });
    },
  });

  const handleSetActiveTab = useCallback((tab: HealthStatusTab) => {
    setActiveTab(tab);
  }, []);

  return {
    triggerRun: (models) => runMutation.mutate(models),
    triggerSingleRun: (modelName) => runMutation.mutate([modelName]),
    isRunning: runMutation.isPending,
    runningModel:
      runMutation.isPending && runMutation.variables?.length === 1
        ? (runMutation.variables as string[])[0]
        : null,
    activeTab,
    setActiveTab: handleSetActiveTab,
  };
}
