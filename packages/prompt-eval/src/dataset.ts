import type { CategoryDefinition, CategoryEvalDataset } from "./types/index.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateDataset(
  dataset: CategoryEvalDataset,
  categories: CategoryDefinition[],
): ValidationResult {
  const errors: string[] = [];
  const validIds = new Set(categories.map((c) => c.id));

  if (!dataset.cases || dataset.cases.length === 0) {
    errors.push("Dataset must have at least one case");
  }

  const seenIds = new Set<string>();

  for (const c of dataset.cases ?? []) {
    if (seenIds.has(c.id)) {
      errors.push(`Duplicate case ID: "${c.id}"`);
    }
    seenIds.add(c.id);

    if (!c.expectedCategories || c.expectedCategories.length === 0) {
      errors.push(`Case "${c.id}" has empty expectedCategories`);
    }

    for (const catId of c.expectedCategories ?? []) {
      if (!validIds.has(catId)) {
        errors.push(`Case "${c.id}" references unknown category: "${catId}"`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
