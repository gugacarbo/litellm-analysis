export type HistoryImportPhase = "spend" | "errors";

export interface HistoryPhaseCounts {
  imported: number;
  skipped: number;
  errors: number;
}

export interface HistoryImportSummary {
  imported: number;
  skipped: number;
  errors: number;
  warnings: string[];
  phases: Partial<Record<HistoryImportPhase, HistoryPhaseCounts>>;
}

export function createEmptyHistorySummary(): HistoryImportSummary {
  return {
    imported: 0,
    skipped: 0,
    errors: 0,
    warnings: [],
    phases: {},
  };
}

export function createEmptyHistoryPhaseCounts(): HistoryPhaseCounts {
  return {
    imported: 0,
    skipped: 0,
    errors: 0,
  };
}

export function mergeHistoryPhaseCounts(
  summary: HistoryImportSummary,
  phase: HistoryImportPhase,
  counts: HistoryPhaseCounts,
): void {
  summary.imported += counts.imported;
  summary.skipped += counts.skipped;
  summary.errors += counts.errors;
  summary.phases[phase] = counts;
}

export interface HistoryImportOptions {
  dryRun: boolean;
  force: boolean;
  only: Set<HistoryImportPhase>;
  batchSize: number;
}

export interface CloudSpendImportOptions {
  dryRun: boolean;
  force: boolean;
  source: string;
}

export interface CloudSpendImportSummary {
  imported: number;
  skipped: number;
  errors: number;
  warnings: string[];
}

export function createEmptyCloudSpendSummary(): CloudSpendImportSummary {
  return {
    imported: 0,
    skipped: 0,
    errors: 0,
    warnings: [],
  };
}
