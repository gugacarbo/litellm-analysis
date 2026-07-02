import { createContext, useContext } from "react";
import type { LiteLLMProvider } from "@/shared/lib/api-client/providers";
import type { ModelWithStatus } from "@/shared/lib/api-client/models";

export interface ModelDetailContextValue {
  model: ModelWithStatus | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  providers: LiteLLMProvider[];
}

export const ModelDetailContext = createContext<ModelDetailContextValue>({
  model: null,
  loading: true,
  error: null,
  notFound: false,
  providers: [],
});

export function useModelDetailContext(): ModelDetailContextValue {
  return useContext(ModelDetailContext);
}
