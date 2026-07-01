import { hasStoredCredentialSecret } from "../lib/credential-secrets.js";
import type { ICredentialsService } from "../services/credentials.service.js";
import type { CredentialRecord } from "../types/credentials.js";

export interface CredentialListItem {
  credentialId: string;
  credentialName: string;
  provider: string | null;
  baseUrl: string | null;
  hasStoredSecret: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export function toPublicCredential(
  record: CredentialRecord,
): CredentialListItem {
  return {
    credentialId: record.id,
    credentialName: record.name,
    provider: record.provider,
    baseUrl: record.baseUrl,
    hasStoredSecret: hasStoredCredentialSecret(record),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listCredentials(
  credentialsService: ICredentialsService,
): Promise<CredentialListItem[]> {
  const fromRegistry = await credentialsService.list();
  return fromRegistry.map(toPublicCredential);
}

export async function credentialExists(
  credentialsService: ICredentialsService,
  credentialName: string,
): Promise<boolean> {
  const normalized = credentialName.trim();
  if (!normalized) {
    return false;
  }

  const credentials = await listCredentials(credentialsService);
  return credentials.some((item) => item.credentialName === normalized);
}
