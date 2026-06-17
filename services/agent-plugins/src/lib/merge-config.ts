function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return false;
  }

  if (Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown>
    ? DeepPartial<T[K]>
    : T[K];
};

function deepMergeObjects(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };

  for (const [key, overrideValue] of Object.entries(override)) {
    const baseValue = result[key];

    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = deepMergeObjects(baseValue, overrideValue);
      continue;
    }

    result[key] = overrideValue;
  }

  return result;
}

function asObject(value: unknown): Record<string, unknown> {
  return isPlainObject(value) ? value : {};
}

export function mergeConfig<T extends Record<string, unknown>>(
  defaults: T,
  overrides?: DeepPartial<T>,
): T {
  return deepMergeObjects(defaults, asObject(overrides)) as T;
}
