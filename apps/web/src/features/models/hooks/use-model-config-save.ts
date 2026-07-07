import { useCallback, useState } from "react";
import { useMutation, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  type ModelConfig,
  type ModelRouteUpdate,
  type ModelWithStatus,
  resolveModelRoute,
  updateModel,
} from "@/shared/lib/api-client/models";
import { updateModelAliases } from "@/shared/lib/api-client/model-aliases";
import { parseExtraParamValue } from "@/features/models/models-form-utils";
import {
  type ModelConfigFormData,
  buildConfigFromFormData,
} from "./use-model-config-form";
import { type UseModelAliasesResult } from "./use-model-aliases";

export interface UseModelConfigSaveArgs {
  model: ModelWithStatus | null;
  formData: ModelConfigFormData;
  aliasesState: UseModelAliasesResult;
  queryClient: QueryClient;
  onSaved: () => void;
}

export interface UseModelConfigSaveResult {
  saving: boolean;
  save: () => Promise<void>;
}

export function useModelConfigSave(
  args: UseModelConfigSaveArgs,
): UseModelConfigSaveResult {
  const { model, formData, aliasesState, queryClient, onSaved } = args;
  const [isSaving, setIsSaving] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (params: {
      modelName: string;
      modelRoute: ModelRouteUpdate;
      config?: ModelConfig["config"];
    }) =>
      updateModel(
        params.modelName,
        params.modelRoute,
        undefined,
        params.config,
      ),
  });

  const save = useCallback(async () => {
    if (!model) return;

    try {
      setIsSaving(true);

      const inputCost = formData.inputCostPerToken.trim()
        ? Number(formData.inputCostPerToken)
        : undefined;
      const outputCost = formData.outputCostPerToken.trim()
        ? Number(formData.outputCostPerToken)
        : undefined;

      if (
        inputCost !== undefined &&
        (!Number.isFinite(inputCost) || inputCost < 0)
      ) {
        toast.error("Input cost must be a valid non-negative number");
        return;
      }

      if (
        outputCost !== undefined &&
        (!Number.isFinite(outputCost) || outputCost < 0)
      ) {
        toast.error("Output cost must be a valid non-negative number");
        return;
      }

      const existingRoute = resolveModelRoute(model);
      const {
        displayName: _displayName,
        family: _family,
        ownedBy: _ownedBy,
        apiMode: _apiMode,
        vision: _vision,
        ...existingRouteRest
      } = existingRoute;
      const routeUpdate: ModelRouteUpdate = {
        ...existingRouteRest,
        upstreamBaseUrl: formData.apiBase || undefined,
        providerName: formData.providerName || undefined,
        enabled: formData.enabled,
        inputCostPerToken: inputCost,
        outputCostPerToken: outputCost,
        requestOptions: { ...existingRoute.requestOptions },
      };

      if (inputCost === undefined) {
        delete routeUpdate.inputCostPerToken;
      }
      if (outputCost === undefined) {
        delete routeUpdate.outputCostPerToken;
      }

      const requestOptions = { ...routeUpdate.requestOptions };
      for (const [key, value] of Object.entries(formData.extraParams)) {
        if (!key) {
          continue;
        }
        const parsed = parseExtraParamValue(value);
        if (parsed !== undefined) {
          requestOptions[key] = parsed;
        } else {
          delete requestOptions[key];
        }
      }
      routeUpdate.requestOptions =
        Object.keys(requestOptions).length > 0 ? requestOptions : undefined;

      const nextAliases = aliasesState.normalizedAliases;
      const aliasValidationError = aliasesState.loaded
        ? aliasesState.getValidationError()
        : null;

      if (aliasesState.loaded && aliasValidationError) {
        toast.error(aliasValidationError);
        return;
      }

      await updateMutation.mutateAsync({
        modelName: model.modelName,
        modelRoute: routeUpdate,
        config: buildConfigFromFormData(formData),
      });

      if (!aliasesState.loaded) {
        await queryClient.invalidateQueries({
          queryKey: ["models-with-config"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["model-aliases", model.modelName],
        });

        onSaved();

        toast.error(
          "Model settings saved, but routing aliases were not loaded, so " +
            "alias changes were not saved.",
        );
        return;
      }

      try {
        await updateModelAliases(model.modelName, nextAliases);

        await queryClient.invalidateQueries({
          queryKey: ["models-with-config"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["model-aliases", model.modelName],
        });

        onSaved();

        toast.success("Model configuration and routing aliases saved");
      } catch (aliasError) {
        await queryClient.invalidateQueries({
          queryKey: ["models-with-config"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["model-aliases", model.modelName],
        });

        toast.error(
          "Model settings saved, but manual routing aliases failed to save. " +
            `Latest saved aliases were reloaded. ${String(aliasError)}`,
        );
      }
    } catch (e) {
      toast.error(`Failed to save: ${e}`);
    } finally {
      setIsSaving(false);
    }
  }, [model, formData, aliasesState, queryClient, onSaved, updateMutation]);

  return {
    saving: isSaving || updateMutation.isPending,
    save,
  };
}
