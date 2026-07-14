import { type QueryClient, queryOptions } from "@tanstack/react-query";
import type { Result } from "../contracts/model-admin";
import {
  discoverModels,
  getModel,
  getProvider,
  listAliases,
  listModels,
  listProviders,
} from "../server/model-admin.functions";

export { createModelAdminQueryClient } from "./query-client";

const modelAdminKey = ["model-admin"] as const;

export const modelAdminQueryKeys = {
  models: {
    all: [...modelAdminKey, "models"] as const,
    list: [...modelAdminKey, "models", "list"] as const,
    detail: (id: string) => [...modelAdminKey, "models", "detail", id] as const,
  },
  providers: {
    all: [...modelAdminKey, "providers"] as const,
    list: [...modelAdminKey, "providers", "list"] as const,
    detail: (id: string) =>
      [...modelAdminKey, "providers", "detail", id] as const,
  },
  aliases: {
    all: [...modelAdminKey, "aliases"] as const,
    list: [...modelAdminKey, "aliases", "list"] as const,
  },
  discovery: {
    byProvider: (providerId: string) =>
      [...modelAdminKey, "discovery", providerId] as const,
  },
} as const;

class ModelAdminQueryError extends Error {
  readonly code: string;
  readonly retryable: boolean;

  constructor(error: { code: string; message: string; retryable: boolean }) {
    super(error.message);
    this.name = "ModelAdminQueryError";
    this.code = error.code;
    this.retryable = error.retryable;
  }
}

async function unwrapResult<T>(request: () => Promise<Result<T>>): Promise<T> {
  const result = await request();
  if (!result.ok) throw new ModelAdminQueryError(result.error);
  return result.data;
}

export const modelAdminQueries = {
  models: () =>
    queryOptions({
      queryKey: modelAdminQueryKeys.models.list,
      queryFn: () => unwrapResult(() => listModels({ data: {} })),
    }),
  model: (id: string) =>
    queryOptions({
      queryKey: modelAdminQueryKeys.models.detail(id),
      queryFn: () => unwrapResult(() => getModel({ data: { id } })),
    }),
  providers: () =>
    queryOptions({
      queryKey: modelAdminQueryKeys.providers.list,
      queryFn: () => unwrapResult(() => listProviders({ data: {} })),
    }),
  provider: (id: string) =>
    queryOptions({
      queryKey: modelAdminQueryKeys.providers.detail(id),
      queryFn: () => unwrapResult(() => getProvider({ data: { id } })),
    }),
  aliases: () =>
    queryOptions({
      queryKey: modelAdminQueryKeys.aliases.list,
      queryFn: () => unwrapResult(() => listAliases({ data: {} })),
    }),
  discovery: (providerId: string) =>
    queryOptions({
      queryKey: modelAdminQueryKeys.discovery.byProvider(providerId),
      queryFn: () =>
        unwrapResult(() => discoverModels({ data: { providerId } })),
    }),
};

export const invalidateModelAdmin = {
  provider: async (queryClient: QueryClient, providerId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: modelAdminQueryKeys.providers.list,
      }),
      queryClient.invalidateQueries({
        queryKey: modelAdminQueryKeys.providers.detail(providerId),
      }),
      queryClient.invalidateQueries({
        queryKey: modelAdminQueryKeys.models.list,
      }),
      queryClient.invalidateQueries({
        queryKey: modelAdminQueryKeys.discovery.byProvider(providerId),
      }),
    ]);
  },
  model: async (
    queryClient: QueryClient,
    input: { id: string; providerId: string; aliasesChanged?: boolean },
  ) => {
    const invalidations = [
      queryClient.invalidateQueries({
        queryKey: modelAdminQueryKeys.models.list,
      }),
      queryClient.invalidateQueries({
        queryKey: modelAdminQueryKeys.models.detail(input.id),
      }),
      queryClient.invalidateQueries({
        queryKey: modelAdminQueryKeys.providers.list,
      }),
      queryClient.invalidateQueries({
        queryKey: modelAdminQueryKeys.providers.detail(input.providerId),
      }),
    ];
    if (input.aliasesChanged) {
      invalidations.push(
        queryClient.invalidateQueries({
          queryKey: modelAdminQueryKeys.aliases.list,
        }),
      );
    }
    await Promise.all(invalidations);
  },
  alias: async (queryClient: QueryClient, targetModelId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: modelAdminQueryKeys.aliases.list,
      }),
      queryClient.invalidateQueries({
        queryKey: modelAdminQueryKeys.models.detail(targetModelId),
      }),
    ]);
  },
  discovery: (queryClient: QueryClient, providerId: string) =>
    queryClient.invalidateQueries({
      queryKey: modelAdminQueryKeys.discovery.byProvider(providerId),
    }),
};
