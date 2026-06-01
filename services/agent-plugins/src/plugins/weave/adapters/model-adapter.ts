export interface WeaveModelData {
  model: string;
}

function resolveModels(role: string, modelNames: readonly string[]): string[] {
  return modelNames.map((slot) => `${role}/${slot}`);
}

export function modelAdapter(
  role: string,
  model: string,
  modelNames: readonly string[],
): WeaveModelData {
  const models = model ? resolveModels(role, modelNames) : [];
  return {
    model: models[0] ?? model,
  };
}
