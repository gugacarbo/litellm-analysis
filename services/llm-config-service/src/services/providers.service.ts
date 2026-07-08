import type { DatabaseClient } from "@lite-llm/database/client";
import {
  encryptProviderSecretIfPlain,
  parseProviderEncryptionKey,
} from "../lib/provider-secrets.js";
import { ProvidersRepository } from "../repositories/providers-repository.js";
import type {
  ProviderCreateInput,
  ProviderRecord,
  ProviderUpdateInput,
} from "../types/providers.js";

export interface ProvidersServiceOptions {
  db?: DatabaseClient;
  encryptionKey?: Buffer;
  repository?: ProvidersRepository;
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
  private readonly encryptionKey: Buffer;

  constructor(options: ProvidersServiceOptions = {}) {
    this.repository =
      options.repository ??
      new ProvidersRepository(
        options.db ??
          (() => {
            throw new Error("ProvidersService requires db or repository");
          })(),
      );
    this.encryptionKey = options.encryptionKey ?? parseProviderEncryptionKey();
  }

  async get(name: string): Promise<ProviderRecord | null> {
    return this.repository.findByName(name);
  }

  async list(): Promise<ProviderRecord[]> {
    return this.repository.list();
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

    const apiKey = input.apiKey?.trim();
    if (!apiKey) {
      throw new Error("apiKey is required to create a provider");
    }

    return this.repository.create({
      name: trimmedName,
      isDefault: input.isDefault ?? false,
      provider: input.provider ?? null,
      baseUrl: input.baseUrl ?? null,
      apiKey: encryptProviderSecretIfPlain(apiKey, this.encryptionKey),
      secretRef: input.secretRef ?? null,
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

    const apiKey =
      input.apiKey !== undefined
        ? encryptProviderSecretIfPlain(input.apiKey.trim(), this.encryptionKey)
        : undefined;

    const updated = await this.repository.update(name, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
      ...(input.provider !== undefined ? { provider: input.provider } : {}),
      ...(input.baseUrl !== undefined ? { baseUrl: input.baseUrl } : {}),
      ...(apiKey !== undefined ? { apiKey } : {}),
      ...(input.secretRef !== undefined ? { secretRef: input.secretRef } : {}),
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
