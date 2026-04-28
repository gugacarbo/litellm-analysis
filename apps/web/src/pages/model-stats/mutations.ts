import { useMutation } from "@tanstack/react-query";
import { deleteModelLogs, mergeModels } from "../../lib/api-client";

export function useModelStatsMutations() {
  const deleteModelLogsMutation = useMutation({
    mutationFn: (modelName: string) => deleteModelLogs(modelName),
  });

  const mergeModelsMutation = useMutation({
    mutationFn: (params: { sourceModel: string; targetModel: string }) =>
      mergeModels(params.sourceModel, params.targetModel),
  });

  return { deleteModelLogsMutation, mergeModelsMutation };
}
