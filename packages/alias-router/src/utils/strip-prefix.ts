/**
 * Strip the "litellm/" prefix from a model name if present.
 */
export function stripLitellmPrefix(model: string): string {
  if (model.startsWith("litellm/")) {
    return model.slice(8);
  }
  return model;
}
