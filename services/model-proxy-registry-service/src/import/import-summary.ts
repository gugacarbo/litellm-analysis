import type { LegacyRequiredEnvVar } from "../types/legacy-import.js";

export type ImportPhase = "settings" | "credentials" | "models";

export interface PhaseCounts {
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
}

export interface ImportSummary {
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  warnings: string[];
  requiredEnvVars: LegacyRequiredEnvVar[];
  phases: Partial<Record<ImportPhase, PhaseCounts>>;
}

export function createEmptySummary(): ImportSummary {
  return {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    warnings: [],
    requiredEnvVars: [],
    phases: {},
  };
}

export function createEmptyPhaseCounts(): PhaseCounts {
  return {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };
}

export function mergePhaseCounts(
  summary: ImportSummary,
  phase: ImportPhase,
  counts: PhaseCounts,
): void {
  summary.inserted += counts.inserted;
  summary.updated += counts.updated;
  summary.skipped += counts.skipped;
  summary.errors += counts.errors;
  summary.phases[phase] = counts;
}

export interface ImportLegacyOptions {
  dryRun: boolean;
  force: boolean;
  only: Set<ImportPhase>;
  allowLegacyApiKey: boolean;
}
