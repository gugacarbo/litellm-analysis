import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { acknowledgeAlertById } from "../../lib/api-client/monitor";

export interface UseMonitorActionsResult {
  acknowledgeAlert: (id: number) => Promise<void>;
  isAcknowledging: boolean;
}

export function useMonitorActions(): UseMonitorActionsResult {
  const queryClient = useQueryClient();

  const acknowledgeMutation = useMutation({
    mutationFn: (id: number) => acknowledgeAlertById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitor", "active-alerts"] });
    },
  });

  const acknowledgeAlert = useCallback(
    async (id: number) => {
      await acknowledgeMutation.mutateAsync(id);
    },
    [acknowledgeMutation],
  );

  return {
    acknowledgeAlert,
    isAcknowledging: acknowledgeMutation.isPending,
  };
}
