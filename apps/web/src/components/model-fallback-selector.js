"use client";
import { useQuery } from "@tanstack/react-query";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getAllModels } from "../lib/api-client/models";
import { queryKeys } from "../lib/query-keys";
import { FallbackList } from "./model-fallback-selector/fallback-list";
import { PrimaryModelSelect } from "./model-fallback-selector/primary-model-select";
import { Badge } from "./ui/badge";
export function ModelFallbackSelector({
  primaryModel,
  fallbackModels,
  onPrimaryModelChange,
  onFallbackModelsChange,
  agentKey,
}) {
  const modelsQuery = useQuery({
    queryKey: queryKeys.models,
    queryFn: getAllModels,
  });
  const availableModels = modelsQuery.data ?? [];
  const getPreviewAliases = () => {
    const aliases = [];
    if (primaryModel) {
      aliases.push(`${agentKey}/gpt-5.5 -> ${primaryModel}`);
    }
    fallbackModels.forEach((model, idx) => {
      if (model) {
        aliases.push(`${agentKey}/gpt-5.${4 - idx} -> ${model}`);
      }
    });
    return aliases;
  };
  return _jsxs("div", {
    className: "space-y-4",
    children: [
      _jsx(PrimaryModelSelect, {
        primaryModel: primaryModel,
        availableModels: availableModels,
        onPrimaryModelChange: onPrimaryModelChange,
      }),
      _jsx(FallbackList, {
        fallbackModels: fallbackModels,
        availableModels: availableModels,
        onFallbackModelsChange: onFallbackModelsChange,
      }),
      _jsxs("div", {
        className: "space-y-2",
        children: [
          _jsx("label", {
            className: "text-sm font-medium",
            children: "Litellm Alias Preview",
          }),
          _jsx("div", {
            className: "space-y-1 text-xs",
            children:
              getPreviewAliases().length > 0
                ? getPreviewAliases().map((alias, idx) =>
                    _jsx(
                      Badge,
                      {
                        variant: "secondary",
                        className: "break-all",
                        children: alias,
                      },
                      idx,
                    ),
                  )
                : _jsx("p", {
                    className: "text-muted-foreground",
                    children: "No aliases will be created",
                  }),
          }),
        ],
      }),
    ],
  });
}
