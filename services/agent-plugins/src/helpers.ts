export function normalizeAgentMappings(
  mappings: Record<string, string | string[]>,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(mappings)) {
    if (Array.isArray(value)) {
      result[key] = value.filter(Boolean);
      continue;
    }

    if (value) {
      result[key] = [value];
      continue;
    }

    result[key] = [];
  }

  return result;
}
