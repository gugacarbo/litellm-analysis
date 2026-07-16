import type { ModelAdminService } from "@lite-llm/llm-config-service";
import type { RoleResult, SessionResult } from "@/features/auth/server/invites";
import type {
  ApplyDiscoverySelectionInput,
  CreateProviderInput,
  DeleteByRevisionInput,
  DomainError,
  ProbeModelInput,
  Result,
  SaveModelInput,
  TestProviderConnectionInput,
  ToggleModelInput,
  UpdateAliasInput,
  UpdateProviderInput,
} from "../contracts/model-admin";
import {
  aliasPublicSchema,
  createProviderInputSchema,
  discoveryApplyResultSchema,
  discoveryResultSchema,
  modelDetailSchema,
  modelSummarySchema,
  mutationSuccessSchema,
  probeModelResultSchema,
  testProviderConnectionInputSchema,
  testProviderResultSchema,
  toProviderPublicDto,
  updateProviderInputSchema,
} from "../contracts/model-admin";

type ModelAdminApi = Pick<
  ModelAdminService,
  | "listModels"
  | "getModel"
  | "saveModel"
  | "toggleModel"
  | "deleteModel"
  | "listProviders"
  | "getProvider"
  | "createProvider"
  | "updateProvider"
  | "setDefaultProvider"
  | "deleteProvider"
  | "listAliases"
  | "updateAlias"
  | "deleteAlias"
  | "discoverModels"
  | "testProvider"
  | "testProviderConnection"
  | "applyDiscoverySelection"
  | "probeModel"
>;

type AuthorizedSession = Extract<SessionResult, { ok: true }>["session"];

export type ModelAdminHandlerDeps = {
  getSession: () => Promise<SessionResult>;
  requireAdmin: (session: AuthorizedSession) => Promise<RoleResult>;
  getService: () => Promise<ModelAdminApi>;
};

function authError(
  code: "UNAUTHENTICATED" | "FORBIDDEN",
  message: string,
): DomainError {
  return { ok: false, error: { code, message, retryable: false } };
}

async function publicError(error: unknown): Promise<DomainError> {
  const { ModelAdminError } = await import("@lite-llm/llm-config-service");
  if (error instanceof ModelAdminError) return error.toPublic();
  return {
    ok: false,
    error: {
      code: "INTERNAL",
      message: "Internal server error",
      retryable: false,
    },
  };
}

async function withRead<T>(
  deps: ModelAdminHandlerDeps,
  operation: (service: ModelAdminApi) => Promise<T>,
): Promise<Result<T>> {
  const session = await deps.getSession();
  if (!session.ok) return authError("UNAUTHENTICATED", session.error.message);
  try {
    return { ok: true, data: await operation(await deps.getService()) };
  } catch (error) {
    return await publicError(error);
  }
}

async function withWrite<T>(
  deps: ModelAdminHandlerDeps,
  operation: (service: ModelAdminApi) => Promise<T>,
): Promise<Result<T>> {
  const session = await deps.getSession();
  if (!session.ok) return authError("UNAUTHENTICATED", session.error.message);
  const role = await deps.requireAdmin(session.session);
  if (!role.ok) return authError("FORBIDDEN", role.error.message);
  try {
    return { ok: true, data: await operation(await deps.getService()) };
  } catch (error) {
    return await publicError(error);
  }
}

function notFound(kind: string): DomainError {
  return {
    ok: false,
    error: {
      code: "NOT_FOUND",
      message: `${kind} not found`,
      retryable: false,
    },
  };
}

function validationError(
  issues: readonly { path: PropertyKey[]; message: string }[],
): DomainError {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = typeof issue.path[0] === "string" ? issue.path[0] : "form";
    const messages = fieldErrors[key];
    if (messages) {
      messages.push(issue.message);
    } else {
      fieldErrors[key] = [issue.message];
    }
  }
  return {
    ok: false,
    error: {
      code: "VALIDATION",
      message: "Invalid input",
      retryable: false,
      fieldErrors,
    },
  };
}

export const handleListModels = (deps: ModelAdminHandlerDeps) =>
  withRead(deps, async (service) =>
    modelSummarySchema.array().parse(await service.listModels()),
  );

export async function handleGetModel(deps: ModelAdminHandlerDeps, id: string) {
  const result = await withRead(deps, async (service) => {
    const model = await service.getModel(id);
    return model === null ? null : modelDetailSchema.parse(model);
  });
  return result.ok && result.data === null ? notFound("Model") : result;
}

export const handleSaveModel = (
  deps: ModelAdminHandlerDeps,
  input: SaveModelInput,
) =>
  withWrite(deps, async (service) =>
    modelDetailSchema.parse(await service.saveModel(input)),
  );

export const handleToggleModel = (
  deps: ModelAdminHandlerDeps,
  input: ToggleModelInput,
) =>
  withWrite(deps, async (service) =>
    modelDetailSchema.parse(await service.toggleModel(input)),
  );

export const handleDeleteModel = (
  deps: ModelAdminHandlerDeps,
  input: DeleteByRevisionInput,
) =>
  withWrite(deps, async (service) => {
    await service.deleteModel(input.id, input.expectedRevision);
    return mutationSuccessSchema.parse({ deleted: true });
  });

export const handleListProviders = (deps: ModelAdminHandlerDeps) =>
  withRead(deps, async (service) =>
    (await service.listProviders()).map(toProviderPublicDto),
  );

export async function handleGetProvider(
  deps: ModelAdminHandlerDeps,
  id: string,
) {
  const result = await withRead(deps, async (service) => {
    const provider = await service.getProvider(id);
    return provider === null ? null : toProviderPublicDto(provider);
  });
  return result.ok && result.data === null ? notFound("Provider") : result;
}

export async function handleCreateProvider(
  deps: ModelAdminHandlerDeps,
  input: CreateProviderInput,
) {
  const parsed = createProviderInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error.issues);
  return withWrite(deps, async (service) =>
    toProviderPublicDto(await service.createProvider(input)),
  );
}

export async function handleUpdateProvider(
  deps: ModelAdminHandlerDeps,
  input: UpdateProviderInput,
) {
  const parsed = updateProviderInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error.issues);
  return withWrite(deps, async (service) =>
    toProviderPublicDto(await service.updateProvider(input)),
  );
}

export const handleSetDefaultProvider = (
  deps: ModelAdminHandlerDeps,
  input: DeleteByRevisionInput,
) =>
  withWrite(deps, async (service) =>
    toProviderPublicDto(await service.setDefaultProvider(input)),
  );

export const handleDeleteProvider = (deps: ModelAdminHandlerDeps, id: string) =>
  withWrite(deps, async (service) => {
    await service.deleteProvider(id);
    return mutationSuccessSchema.parse({ deleted: true });
  });

export const handleListAliases = (deps: ModelAdminHandlerDeps) =>
  withRead(deps, async (service) =>
    aliasPublicSchema.array().parse(await service.listAliases()),
  );

export const handleUpdateAlias = (
  deps: ModelAdminHandlerDeps,
  input: UpdateAliasInput,
) =>
  withWrite(deps, async (service) =>
    aliasPublicSchema.parse(await service.updateAlias(input)),
  );

export const handleDeleteAlias = (
  deps: ModelAdminHandlerDeps,
  input: DeleteByRevisionInput,
) =>
  withWrite(deps, async (service) => {
    await service.deleteAlias(input.id, input.expectedRevision);
    return mutationSuccessSchema.parse({ deleted: true });
  });

export const handleDiscoverModels = (
  deps: ModelAdminHandlerDeps,
  providerId: string,
) =>
  withWrite(deps, async (service) =>
    discoveryResultSchema.parse(await service.discoverModels(providerId)),
  );

export const handleTestProvider = (
  deps: ModelAdminHandlerDeps,
  providerId: string,
) =>
  withWrite(deps, async (service) =>
    testProviderResultSchema.parse(await service.testProvider(providerId)),
  );

export const handleTestProviderConnection = async (
  deps: ModelAdminHandlerDeps,
  input: TestProviderConnectionInput,
) => {
  const parsed = testProviderConnectionInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error.issues);
  return await withWrite(deps, async (service) =>
    testProviderResultSchema.parse(
      await service.testProviderConnection(parsed.data),
    ),
  );
};

export const handleApplyDiscoverySelection = (
  deps: ModelAdminHandlerDeps,
  input: ApplyDiscoverySelectionInput,
) =>
  withWrite(deps, async (service) =>
    discoveryApplyResultSchema
      .array()
      .parse(await service.applyDiscoverySelection(input)),
  );

export const handleProbeModel = (
  deps: ModelAdminHandlerDeps,
  input: ProbeModelInput,
) =>
  withWrite(deps, async (service) =>
    probeModelResultSchema.parse(await service.probeModel(input)),
  );
