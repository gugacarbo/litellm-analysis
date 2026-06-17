export interface LegacyImportPhaseSummary {
  inserted: number;
  updated: number;
  skipped: number;
  errors: LegacyImportError[];
  warnings: string[];
  requiredEnvVars: LegacyRequiredEnvVar[];
}

export interface LegacyImportError {
  key?: string;
  name?: string;
  message: string;
}

export interface LegacyRequiredEnvVar {
  credential: string;
  secretRef: string;
  action: string;
}

export interface LegacyImportOptions {
  dryRun?: boolean;
  force?: boolean;
  allowLegacyApiKey?: boolean;
}

export function createEmptyLegacyImportSummary(): LegacyImportPhaseSummary {
  return {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    warnings: [],
    requiredEnvVars: [],
  };
}
