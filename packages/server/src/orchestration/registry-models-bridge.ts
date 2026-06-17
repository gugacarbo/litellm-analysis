import type { AnalyticsDataSource } from "@lite-llm/analytics-service/types";
import {
  fromModelRoute,
  type IRegistryModelsService,
  listModelsWithRegistryFirst,
  type ModelRoute,
  type ModelRouteUpdate,
  toLegacyEntry,
  toModelRoute,
} from "@lite-llm/model-proxy-registry-service";
import type { DbModelSpecLike } from "../types/index";
import {
  applyRequiredLiteLLMParams,
  buildLiteLLMParams,
  buildMergedLiteLLMParams,
  coerceLiteLLMParams,
  isRecord,
} from "./lite-llm-params";

export { listModelsWithRegistryFirst, toLegacyEntry };

export function resolveLitellmParamsFromBody(body: {
  modelRoute?: unknown;
  litellmParams?: unknown;
  modelName?: string;
}): Record<string, unknown> {
  if (body.litellmParams !== undefined) {
    throw new Error(
      "litellmParams is deprecated; send modelRoute instead (Batch 5)",
    );
  }

  if (isRecord(body.modelRoute) && Object.keys(body.modelRoute).length > 0) {
    const route = {
      ...body.modelRoute,
      modelName:
        typeof body.modelRoute.modelName === "string" &&
        body.modelRoute.modelName.trim()
          ? body.modelRoute.modelName.trim()
          : typeof body.modelName === "string"
            ? body.modelName.trim()
            : "",
    } as ModelRoute;
    return fromModelRoute(route);
  }

  return coerceLiteLLMParams(
    isRecord(body.litellmParams) ? body.litellmParams : {},
  );
}

export async function createRegistryModelFromSpec(
  registryModelsService: IRegistryModelsService,
  modelName: string,
  spec: DbModelSpecLike,
  credentialName: string | null,
  existingParams: Record<string, unknown> = {},
): Promise<void> {
  const litellmParams = buildLiteLLMParams(modelName, spec, credentialName);
  const route = toModelRoute(litellmParams, modelName);
  await registryModelsService.upsert(modelName, route);
}

export async function mergeRegistryModelFromSpec(
  registryModelsService: IRegistryModelsService,
  modelName: string,
  spec: DbModelSpecLike,
  credentialName: string | null,
  existingParams: Record<string, unknown> = {},
): Promise<void> {
  const litellmParams = buildMergedLiteLLMParams(
    modelName,
    spec,
    existingParams,
    credentialName,
  );
  const route = toModelRoute(litellmParams, modelName);
  await registryModelsService.upsert(modelName, route);
}

export async function createRegistryModelFromParams(
  registryModelsService: IRegistryModelsService,
  modelName: string,
  litellmParams: Record<string, unknown>,
  credentialName: string | null,
): Promise<void> {
  const normalized = applyRequiredLiteLLMParams(
    modelName,
    litellmParams,
    credentialName,
  );
  const route = toModelRoute(normalized, modelName);
  await registryModelsService.create(modelName, route);
}

export async function updateRegistryModelFromParams(
  registryModelsService: IRegistryModelsService,
  modelName: string,
  litellmParams: Record<string, unknown>,
  credentialName: string | null,
  newModelName?: string,
): Promise<void> {
  const normalized = applyRequiredLiteLLMParams(
    newModelName ?? modelName,
    litellmParams,
    credentialName,
  );
  const route = toModelRoute(normalized, newModelName ?? modelName);

  if (newModelName && newModelName !== modelName) {
    await registryModelsService.create(newModelName, route);
    await registryModelsService.delete(modelName);
    return;
  }

  try {
    await registryModelsService.update(modelName, route);
  } catch {
    await registryModelsService.create(modelName, route);
  }
}

export function routeUpdateFromParams(
  litellmParams: Record<string, unknown>,
  modelName: string,
): ModelRouteUpdate {
  return toModelRoute(litellmParams, modelName);
}

export async function listRegistryRoutes(
  registryModelsService: IRegistryModelsService,
  dataSource: AnalyticsDataSource,
): Promise<ModelRoute[]> {
  const models = await listModelsWithRegistryFirst(
    registryModelsService,
    dataSource,
  );
  return models.map((model) =>
    toModelRoute(model.litellmParams, model.modelName),
  );
}

export function toLitellmParamsShim(
  route: ModelRoute,
): Record<string, unknown> {
  return fromModelRoute(route);
}
