import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { acknowledgeAlertById } from "@/shared/lib/api-client/monitor";
import type { MonitorAlert } from "../types/monitor-types";

interface UseMonitorActionsResult {
  acknowledgeAlert: (id: number) => Promise<void>;
  isAcknowledging: boolean;
  selectedAlert: MonitorAlert | null;
  onSelectAlert: (alert: MonitorAlert | null) => void;
  onClearSelectedAlert: () => void;
}

export function useMonitorActions(): UseMonitorActionsResult {
  const queryClient = useQueryClient();
  const [selectedAlert, setSelectedAlert] = useState<MonitorAlert | null>(null);

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

  const onSelectAlert = useCallback((alert: MonitorAlert | null) => {
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
