export function modelAdapter(
  model: string | undefined,
  enabledSet: Set<string>,
): string | null {
  if (!model || !enabledSet.has(model)) {
    return null;
  }
  return model;
}
