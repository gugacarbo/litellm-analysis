import { createContext, useContext } from "react";
import type { LiteLLMCredential } from "@/shared/lib/api-client/credentials";
import type { ModelWithStatus } from "@/shared/lib/api-client/models";

export interface ModelDetailContextValue {
  model: ModelWithStatus | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  credentials: LiteLLMCredential[];
}

export const ModelDetailContext = createContext<ModelDetailContextValue>({
  model: null,
  loading: true,
  error: null,
  notFound: false,
  credentials: [],
});

export function useModelDetailContext(): ModelDetailContextValue {
  return useContext(ModelDetailContext);
}
