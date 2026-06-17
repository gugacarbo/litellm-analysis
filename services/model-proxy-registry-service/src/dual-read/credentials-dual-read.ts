import { getAllCredentials } from "@lite-llm/analytics-service/queries";
import { deriveSecretRefFromCredentialName } from "../adapters/derive-secret-ref.js";
import type { ICredentialsService } from "../services/credentials.service.js";
import type { CredentialRecord } from "../types/credentials.js";

export interface CredentialListItem {
  credentialId: string;
  credentialName: string;
  provider: string | null;
  baseUrl: string | null;
  secretRef: string | null;
  createdAt: string | null;
  updatedAt: string | null;
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

export function toPublicCredential(
  record: CredentialRecord,
): CredentialListItem {
  return {
    credentialId: record.id,
    credentialName: record.name,
    provider: record.provider,
    baseUrl: record.baseUrl,
    secretRef: record.secretRef,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toPublicCredentialFromLegacy(row: {
  credentialId: string;
  credentialName: string;
  credentialValues: Record<string, unknown> | null;
  credentialInfo: Record<string, unknown> | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}): CredentialListItem {
  return {
    credentialId: row.credentialId,
    credentialName: row.credentialName,
    provider: readStringField(row.credentialInfo, "custom_llm_provider"),
    baseUrl: readStringField(row.credentialValues, "api_base"),
    secretRef: deriveSecretRefFromCredentialName(row.credentialName),
    createdAt: row.createdAt ? String(row.createdAt) : null,
    updatedAt: row.updatedAt ? String(row.updatedAt) : null,
  };
}

export async function listCredentialsWithFallback(
  credentialsService: ICredentialsService,
): Promise<CredentialListItem[]> {
  const fromRegistry = await credentialsService.list();
  if (fromRegistry.length > 0) {
    return fromRegistry.map(toPublicCredential);
  }

  try {
    const legacy = await getAllCredentials();
    return legacy.map(toPublicCredentialFromLegacy);
  } catch {
    return [];
  }
}

export async function credentialExistsWithFallback(
  credentialsService: ICredentialsService,
  credentialName: string,
): Promise<boolean> {
  const normalized = credentialName.trim();
  if (!normalized) {
    return false;
  }

  const credentials = await listCredentialsWithFallback(credentialsService);
  return credentials.some((item) => item.credentialName === normalized);
}
