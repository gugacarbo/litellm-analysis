import { getAllCredentials } from "@lite-llm/analytics-service/queries";
import type {
  CredentialsRepository,
  LegacyCredentialImportData,
} from "../repositories/credentials-repository.js";
import {
  createEmptyLegacyImportSummary,
  type LegacyImportOptions,
  type LegacyImportPhaseSummary,
  type LegacyRequiredEnvVar,
} from "../types/legacy-import.js";
import { deriveSecretRefFromCredentialName } from "./derive-secret-ref.js";

export { deriveSecretRefFromCredentialName } from "./derive-secret-ref.js";

const KNOWN_CREDENTIAL_VALUE_KEYS = new Set([
  "api_base",
  "api_key",
  "api_version",
]);

export interface LiteLLMCredentialRow {
  credentialId: string;
  credentialName: string;
  credentialValues: Record<string, unknown> | null;
  credentialInfo: Record<string, unknown> | null;
  createdAt: Date | null;
  createdBy: string | null;
  updatedAt: Date | null;
  updatedBy: string | null;
}

/** Slim row shape used by the legacy import CLI. */
export interface LegacyCredentialRow {
  credentialName: string;
  credentialValues: Record<string, unknown> | null;
  credentialInfo: Record<string, unknown> | null;
}

export type RequiredEnvVarEntry = LegacyRequiredEnvVar;

export interface LegacyCredentialsReader {
  getAllCredentials(): Promise<LiteLLMCredentialRow[]>;
}

export interface LegacyCredentialsAdapterOptions extends LegacyImportOptions {
  repository: CredentialsRepository;
  reader?: LegacyCredentialsReader;
}

export interface MapLegacyCredentialOptions {
  allowLegacyApiKey?: boolean;
}

export interface MappedLegacyCredential {
  data: LegacyCredentialImportData & { apiKey: string | null };
  requiredEnvVar: LegacyRequiredEnvVar | null;
  unexpectedKeys: string[];
}

export const deriveSecretRef = deriveSecretRefFromCredentialName;

function createDefaultLegacyCredentialsReader(): LegacyCredentialsReader {
  return {
    getAllCredentials,
  };
}

function readStringField(
  record: Record<string, unknown> | null,
  field: string,
): string | null {
  if (!record) {
    return null;
  }
  const value = record[field];
  return typeof value === "string" ? value : null;
}

function hasNonEmptyApiKey(
  credentialValues: Record<string, unknown> | null,
): boolean {
  const apiKey = credentialValues?.api_key;
  return typeof apiKey === "string" && apiKey.trim().length > 0;
}

function collectUnexpectedCredentialValueKeys(
  credentialValues: Record<string, unknown> | null,
): string[] {
  if (!credentialValues) {
    return [];
  }
  return Object.keys(credentialValues).filter(
    (key) => !KNOWN_CREDENTIAL_VALUE_KEYS.has(key),
  );
}

export function mapLegacyCredential(
  row: LegacyCredentialRow,
  options: MapLegacyCredentialOptions = {},
): MappedLegacyCredential {
  const unexpectedKeys = collectUnexpectedCredentialValueKeys(
    row.credentialValues,
  );
  const provider = readStringField(row.credentialInfo, "custom_llm_provider");
  const baseUrl = readStringField(row.credentialValues, "api_base");

  let secretRef: string | null = null;
  let requiredEnvVar: LegacyRequiredEnvVar | null = null;
  let apiKey: string | null = null;

  if (hasNonEmptyApiKey(row.credentialValues)) {
    secretRef = deriveSecretRefFromCredentialName(row.credentialName);
    requiredEnvVar = {
      credential: row.credentialName,
      secretRef,
      action: "set env var before proxy start",
    };
    if (options.allowLegacyApiKey) {
      apiKey = String(row.credentialValues?.api_key).trim();
    }
  }

  return {
    data: {
      name: row.credentialName,
      provider,
      baseUrl,
      secretRef,
      apiKey,
    },
    requiredEnvVar,
    unexpectedKeys,
  };
}

export function mapLegacyCredentialRow(row: LiteLLMCredentialRow): {
  data: LegacyCredentialImportData;
  requiredEnvVar: LegacyRequiredEnvVar | null;
  warnings: string[];
} {
  const mapped = mapLegacyCredential(row);
  return {
    data: {
      name: mapped.data.name,
      provider: mapped.data.provider,
      baseUrl: mapped.data.baseUrl,
      secretRef: mapped.data.secretRef,
    },
    requiredEnvVar: mapped.requiredEnvVar,
    warnings: mapped.unexpectedKeys.map(
      (key) =>
        `Credential "${row.credentialName}" has unmapped credential_values key "${key}"`,
    ),
  };
}

export async function importLegacyCredentials(
  options: LegacyCredentialsAdapterOptions,
): Promise<LegacyImportPhaseSummary> {
  const reader = options.reader ?? createDefaultLegacyCredentialsReader();
  const {
    repository,
    dryRun = false,
    force = false,
    allowLegacyApiKey = false,
  } = options;
  const summary = createEmptyLegacyImportSummary();

  let rows: LiteLLMCredentialRow[];
  try {
    rows = await reader.getAllCredentials();
  } catch (error) {
    summary.errors.push({
      message: error instanceof Error ? error.message : String(error),
    });
    return summary;
  }

  for (const row of rows) {
    if (!row.credentialName?.trim()) {
      summary.errors.push({
        message: "Skipped credential row with empty credential_name",
      });
      continue;
    }

    const mapped = mapLegacyCredential(row, { allowLegacyApiKey });
    summary.warnings.push(
      ...mapped.unexpectedKeys.map(
        (key) =>
          `Credential "${row.credentialName}" has unmapped credential_values key "${key}"`,
      ),
    );

    if (mapped.requiredEnvVar) {
      summary.requiredEnvVars.push(mapped.requiredEnvVar);
    }

    try {
      const importData: LegacyCredentialImportData = {
        name: mapped.data.name,
        provider: mapped.data.provider,
        baseUrl: mapped.data.baseUrl,
        secretRef: mapped.data.secretRef,
      };
      const outcome = dryRun
        ? await repository.previewLegacyImport(importData, force)
        : await repository.upsertLegacyImport(importData, force, {
            allowLegacyApiKey,
            apiKey: mapped.data.apiKey,
          });

      if (outcome === "inserted") {
        summary.inserted += 1;
      } else if (outcome === "updated") {
        summary.updated += 1;
      } else {
        summary.skipped += 1;
      }
    } catch (error) {
      summary.errors.push({
        name: row.credentialName,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return summary;
}
