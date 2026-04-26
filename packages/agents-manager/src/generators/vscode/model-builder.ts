import type { DbModelSpec } from '../../types/index.js';

export interface VscodeModelEntry {
  id: string;
  owned_by: string;
  displayName: string;
  baseUrl: string;
  apiMode: string;
  context_length: number;
  limit: { output: number };
  family?: string;
}

export function humanize(str: string): string {
  return str.split(/[-_.]/).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function buildVscodeModelsArray(
  models: Record<string, DbModelSpec>,
  baseUrl: string,
): VscodeModelEntry[] {
  return Object.entries(models).map(([modelId, spec]) => ({
    id: modelId,
    owned_by: spec.ownedBy ?? 'atplus',
    displayName: spec.displayName ?? humanize(modelId),
    baseUrl,
    apiMode: 'openai',
    context_length: spec.contextLength,
    limit: { output: spec.maxOutput },
    ...(spec.family ? { family: spec.family } : {}),
  }));
}
