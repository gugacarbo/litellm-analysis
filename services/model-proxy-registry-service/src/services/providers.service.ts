import type { PrismaClient } from "@lite-llm/model-proxy-repository";
import {
  encryptProviderSecret,
  isEncryptedProviderSecret,
  looksLikeEnvVarName,
  parseProviderEncryptionKey,
} from "../lib/provider-secrets.js";
import { ProvidersRepository } from "../repositories/providers-repository.js";
import type {
  ProviderCreateInput,
  ProviderRecord,
  ProviderUpdateInput,
} from "../types/providers.js";

export interface ProvidersServiceOptions {
  prisma?: PrismaClient;
  repository?: ProvidersRepository;
}

function normalizeSecretInput(
  input: ProviderCreateInput | ProviderUpdateInput,
  action: string,
): { apiKey?: string; secretRef?: string } {
  const apiKey = input.apiKey?.trim() ?? "";
  const secretRef = input.secretRef?.trim() ?? "";

  const normalizedSecretRef =
    secretRef && looksLikeEnvVarName(secretRef) ? secretRef : "";
  const normalizedApiKey =
    apiKey || (secretRef && !looksLikeEnvVarName(secretRef) ? secretRef : "");

  if (!normalizedApiKey && !normalizedSecretRef) {
    throw new Error(`apiKey or secretRef is required to ${action} a provider`);
  }

  if (normalizedApiKey && normalizedSecretRef) {
    throw new Error("Provide either apiKey or secretRef, not both");
  }

  return normalizedApiKey
    ? { apiKey: normalizedApiKey }
    : { secretRef: normalizedSecretRef };
}

export interface IProvidersService {
  get(name: string): Promise<ProviderRecord | null>;
  list(): Promise<ProviderRecord[]>;
  create(input: ProviderCreateInput): Promise<ProviderRecord>;
  update(name: string, input: ProviderUpdateInput): Promise<ProviderRecord>;
  delete(name: string): Promise<boolean>;
}

export class ProvidersService implements IProvidersService {
  private readonly repository: ProvidersRepository;
  private encryptionKey: Buffer | null = null;

  constructor(options: ProvidersServiceOptions = {}) {
    this.repository =
      options.repository ??
      new ProvidersRepository(
        options.prisma ??
          (() => {
            throw new Error("ProvidersService requires prisma or repository");
          })(),
      );
  }

  private getEncryptionKey(): Buffer {
    if (!this.encryptionKey) {
      this.encryptionKey = parseProviderEncryptionKey();
    }
    return this.encryptionKey;
  }

  private async migrateStoredSecretIfNeeded(
    record: ProviderRecord,
  ): Promise<ProviderRecord> {
    const rawApiKey = record.apiKey?.trim() ?? "";
    if (rawApiKey && !isEncryptedProviderSecret(rawApiKey)) {
      const updated = await this.repository.update(record.name, {
        apiKey: encryptProviderSecret(rawApiKey, this.getEncryptionKey()),
      });
      return updated ?? record;
    }

    const secretRef = record.secretRef?.trim() ?? "";
    if (secretRef && !looksLikeEnvVarName(secretRef)) {
      const updated = await this.repository.update(record.name, {
        apiKey: encryptProviderSecret(secretRef, this.getEncryptionKey()),
        secretRef: null,
      });
      return updated ?? record;
    }

    return record;
  }

  async get(name: string): Promise<ProviderRecord | null> {
    const record = await this.repository.findByName(name);
    if (!record) {
      return null;
    }
    return this.migrateStoredSecretIfNeeded(record);
  }

  async list(): Promise<ProviderRecord[]> {
    const records = await this.repository.list();
    return Promise.all(
      records.map((record) => this.migrateStoredSecretIfNeeded(record)),
    );
  }

  async create(input: ProviderCreateInput): Promise<ProviderRecord> {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new Error("Provider name must be a non-empty string");
    }

    const existing = await this.repository.findByName(trimmedName);
    if (existing) {
      throw new Error(`Provider "${trimmedName}" already exists`);
    }

    const secret = normalizeSecretInput(input, "create");
    return this.repository.create({
      name: trimmedName,
      provider: input.provider ?? null,
      baseUrl: input.baseUrl ?? null,
      ...(secret.apiKey
        ? {
            apiKey: encryptProviderSecret(
              secret.apiKey,
              this.getEncryptionKey(),
            ),
            secretRef: null,
          }
        : {
            apiKey: null,
            secretRef: secret.secretRef ?? null,
          }),
    });
  }

  async update(
    name: string,
    input: ProviderUpdateInput,
  ): Promise<ProviderRecord> {
    const existing = await this.repository.findByName(name);
    if (!existing) {
      throw new Error(`Provider "${name}" not found`);
    }

    const secretUpdate =
      input.apiKey !== undefined || input.secretRef !== undefined
        ? normalizeSecretInput(input, "update")
        : null;
    const updated = await this.repository.update(name, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.provider !== undefined ? { provider: input.provider } : {}),
      ...(input.baseUrl !== undefined ? { baseUrl: input.baseUrl } : {}),
      ...(secretUpdate?.apiKey
        ? {
            apiKey: encryptProviderSecret(
              secretUpdate.apiKey,
              this.getEncryptionKey(),
            ),
            secretRef: null,
          }
        : secretUpdate?.secretRef
          ? {
              apiKey: null,
              secretRef: secretUpdate.secretRef,
            }
          : {}),
    });

    if (!updated) {
      throw new Error(`Provider "${name}" not found`);
    }

    return updated;
  }

  async delete(name: string): Promise<boolean> {
    return this.repository.delete(name);
  }
}
