export type ModelSlotNames = readonly string[];

function normalizeModel(value: string | undefined): string {
  return (value || "").trim();
}

/** Resolve which backend model id fills logical slot. */
function resolveSlotModelId(
  slotIndex: number,
  _slotCount: number,
  primaryModelId: string,
  globalFallbackModelId: string | undefined,
): string {
  const primary = (primaryModelId || "").trim();
  const fallback = (globalFallbackModelId || "").trim();

  if (slotIndex !== 0) {
    return "";
  }

  return primary || fallback;
}

function resolveSlotModel(
  slotIndex: number,
  slotCount: number,
  primaryModel: string,
  globalFallbackModel: string,
): string {
  return resolveSlotModelId(
    slotIndex,
    slotCount,
    primaryModel,
    globalFallbackModel,
  );
}

/**
 * Generate model aliases for agent/category key using single slot.
 * Uses primary model, fallback only when primary absent.
 */
export function generateModelAliases(
  key: string,
  model: string,
  globalFallbackModel: string | undefined,
  modelNames: ModelSlotNames,
): Record<string, string> {
  const aliases: Record<string, string> = {};
  const normalizedModel = normalizeModel(model);
  const normalizedGlobalFallback = normalizeModel(globalFallbackModel);

  for (let i = 0; i < modelNames.length; i++) {
    const resolvedModel = resolveSlotModel(
      i,
      modelNames.length,
      normalizedModel,
      normalizedGlobalFallback,
    );
    if (!resolvedModel) {
      continue;
    }
    aliases[`${key}/${modelNames[i]}`] = resolvedModel;
  }

  return aliases;
}
