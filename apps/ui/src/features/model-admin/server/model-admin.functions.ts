import { createServerFn } from "@tanstack/react-start";
import {
  applyDiscoverySelectionInputSchema,
  createProviderInputSchema,
  type DomainError,
  deleteByRevisionInputSchema,
  discoverModelsInputSchema,
  emptyInputSchema,
  idInputSchema,
  probeModelInputSchema,
  saveModelInputSchema,
  setDefaultProviderInputSchema,
  toggleModelInputSchema,
  updateAliasInputSchema,
  updateProviderInputSchema,
} from "../contracts/model-admin";
import {
  handleApplyDiscoverySelection,
  handleCreateProvider,
  handleDeleteAlias,
  handleDeleteModel,
  handleDeleteProvider,
  handleDiscoverModels,
  handleGetModel,
  handleGetProvider,
  handleListAliases,
  handleListModels,
  handleListProviders,
  handleProbeModel,
  handleSaveModel,
  handleSetDefaultProvider,
  handleToggleModel,
  handleUpdateAlias,
  handleUpdateProvider,
  type ModelAdminHandlerDeps,
} from "./model-admin.handlers";

async function runtimeDeps(): Promise<ModelAdminHandlerDeps | DomainError> {
  const [{ getAuth }, { getRequest }, { requireRole, requireSession }] =
    await Promise.all([
      import("@/features/auth/server/auth"),
      import("@tanstack/react-start/server"),
      import("@/features/auth/server/invites"),
    ]);
  const request = getRequest();
  if (!request) {
    return {
      ok: false,
      error: {
        code: "UNAUTHENTICATED",
        message: "No request",
        retryable: false,
      },
    };
  }
  const auth = getAuth();
  return {
    getSession: () => requireSession({ auth, request }),
    requireAdmin: (session) => requireRole({ session, role: "admin" }),
    // Deliberately lazy: unauthenticated and viewer calls never resolve DB,
    // decrypt credentials, or create an outbound-capable service instance.
    getService: async () => {
      const [
        { getDb },
        { ModelAdminService },
        { readProviderDestinationAllowlist },
      ] = await Promise.all([
        import("@lite-llm/database/client"),
        import("@lite-llm/llm-config-service"),
        import("./upstream-policy"),
      ]);
      return new ModelAdminService({
        db: getDb(),
        destinationAllowlist: readProviderDestinationAllowlist(),
      });
    },
  };
}

async function withRuntime<T>(
  operation: (deps: ModelAdminHandlerDeps) => Promise<T>,
): Promise<T | DomainError> {
  const deps = await runtimeDeps();
  return "getService" in deps ? operation(deps) : deps;
}

export const listModels = createServerFn({ method: "GET" })
  .validator(emptyInputSchema)
  .handler(() => withRuntime(handleListModels));

export const getModel = createServerFn({ method: "GET" })
  .validator(idInputSchema)
  .handler(({ data }) => withRuntime((deps) => handleGetModel(deps, data.id)));

export const saveModel = createServerFn({ method: "POST" })
  .validator(saveModelInputSchema)
  .handler(({ data }) => withRuntime((deps) => handleSaveModel(deps, data)));

export const toggleModel = createServerFn({ method: "POST" })
  .validator(toggleModelInputSchema)
  .handler(({ data }) => withRuntime((deps) => handleToggleModel(deps, data)));

export const deleteModel = createServerFn({ method: "POST" })
  .validator(deleteByRevisionInputSchema)
  .handler(({ data }) => withRuntime((deps) => handleDeleteModel(deps, data)));

export const listProviders = createServerFn({ method: "GET" })
  .validator(emptyInputSchema)
  .handler(() => withRuntime(handleListProviders));

export const getProvider = createServerFn({ method: "GET" })
  .validator(idInputSchema)
  .handler(({ data }) =>
    withRuntime((deps) => handleGetProvider(deps, data.id)),
  );

export const createProvider = createServerFn({ method: "POST" })
  .validator(createProviderInputSchema)
  .handler(({ data }) =>
    withRuntime((deps) => handleCreateProvider(deps, data)),
  );

export const updateProvider = createServerFn({ method: "POST" })
  .validator(updateProviderInputSchema)
  .handler(({ data }) =>
    withRuntime((deps) => handleUpdateProvider(deps, data)),
  );

export const setDefaultProvider = createServerFn({ method: "POST" })
  .validator(setDefaultProviderInputSchema)
  .handler(({ data }) =>
    withRuntime((deps) => handleSetDefaultProvider(deps, data)),
  );

export const deleteProvider = createServerFn({ method: "POST" })
  .validator(idInputSchema)
  .handler(({ data }) =>
    withRuntime((deps) => handleDeleteProvider(deps, data.id)),
  );

export const listAliases = createServerFn({ method: "GET" })
  .validator(emptyInputSchema)
  .handler(() => withRuntime(handleListAliases));

export const updateAlias = createServerFn({ method: "POST" })
  .validator(updateAliasInputSchema)
  .handler(({ data }) => withRuntime((deps) => handleUpdateAlias(deps, data)));

export const deleteAlias = createServerFn({ method: "POST" })
  .validator(deleteByRevisionInputSchema)
  .handler(({ data }) => withRuntime((deps) => handleDeleteAlias(deps, data)));

export const discoverModels = createServerFn({ method: "POST" })
  .validator(discoverModelsInputSchema)
  .handler(({ data }) =>
    withRuntime((deps) => handleDiscoverModels(deps, data.providerId)),
  );

export const applyDiscoverySelection = createServerFn({ method: "POST" })
  .validator(applyDiscoverySelectionInputSchema)
  .handler(({ data }) =>
    withRuntime((deps) => handleApplyDiscoverySelection(deps, data)),
  );

export const probeModel = createServerFn({ method: "POST" })
  .validator(probeModelInputSchema)
  .handler(({ data }) => withRuntime((deps) => handleProbeModel(deps, data)));
