import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { acknowledgeAlertById } from "../../lib/api-client/monitor";
export function useMonitorActions() {
  const queryClient = useQueryClient();
  const [selectedAlert, setSelectedAlert] = useState(null);
  const acknowledgeMutation = useMutation({
    mutationFn: (id) => acknowledgeAlertById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitor", "active-alerts"] });
    },
  });
  const acknowledgeAlert = useCallback(
    async (id) => {
      await acknowledgeMutation.mutateAsync(id);
    },
    [acknowledgeMutation],
  );
  const onSelectAlert = useCallback((alert) => {
    setSelectedAlert(alert);
  }, []);
  const onClearSelectedAlert = useCallback(() => {
    setSelectedAlert(null);
  }, []);
  return {
    acknowledgeAlert,
    isAcknowledging: acknowledgeMutation.isPending,
    selectedAlert,
    onSelectAlert,
    onClearSelectedAlert,
  };
}
