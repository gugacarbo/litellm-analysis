import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelEval, startEval } from "../../lib/api-client/prompt-evals";

export function usePromptEvalsActions() {
  const queryClient = useQueryClient();

  const startMutation = useMutation({
    mutationFn: ({
      model,
      threshold,
      cases,
    }: {
      model: string;
      threshold: number;
      cases: Array<{ id: string; input: string; expectedCategories: string[] }>;
    }) => startEval(model, cases, threshold),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompt-evals"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (runId: string) => cancelEval(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompt-evals"] });
    },
  });

  return {
    startEval: startMutation.mutate,
    isStarting: startMutation.isPending,
    startError: startMutation.error,
    cancelEval: cancelMutation.mutate,
    isCancelling: cancelMutation.isPending,
  };
}
