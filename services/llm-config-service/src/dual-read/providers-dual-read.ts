import { hasStoredProviderSecret } from "../lib/provider-secrets.js";
import type { IProvidersService } from "../services/providers.service.js";
import type { ProviderRecord } from "../types/providers.js";

export interface ProviderListItem {
  providerId: string;
  providerName: string;
  provider: string | null;
  baseUrl: string | null;
  hasStoredSecret: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export function toPublicProvider(record: ProviderRecord): ProviderListItem {
  return {
    providerId: record.id,
    providerName: record.name,
    provider: record.provider,
    baseUrl: record.baseUrl,
    hasStoredSecret:
      hasStoredProviderSecret(record) || Boolean(record.apiKey?.trim()),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listProviders(
  providersService: IProvidersService,
): Promise<ProviderListItem[]> {
  const fromRegistry = await providersService.list();
  return fromRegistry.map(toPublicProvider);
}

export async function providerExists(
  providersService: IProvidersService,
  providerName: string,
): Promise<boolean> {
  const normalized = providerName.trim();
  if (!normalized) {
    return false;
  }

  const providers = await listProviders(providersService);
  return providers.some((item) => item.providerName === normalized);
}
