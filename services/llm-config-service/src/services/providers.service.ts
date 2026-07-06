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

function normalizeSecretInput(
  input: ProviderCreateInput | ProviderUpdateInput,
  action: string,
  encryptionKey: Buffer,
): { secretRef: string } {
  const secretRef = input.secretRef?.trim() ?? "";
  if (!secretRef) {
    throw new Error(`secretRef is required to ${action} a provider`);
  }

  return { secretRef: encryptProviderSecretIfPlain(secretRef, encryptionKey) };
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
    this.encryptionKey =
      options.encryptionKey ?? parseProviderEncryptionKey();
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

    const secret = normalizeSecretInput(input, "create", this.encryptionKey);
    return this.repository.create({
      name: trimmedName,
      provider: input.provider ?? null,
      baseUrl: input.baseUrl ?? null,
      secretRef: secret.secretRef,
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
      input.secretRef !== undefined
        ? normalizeSecretInput(input, "update", this.encryptionKey)
        : null;
    const updated = await this.repository.update(name, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.provider !== undefined ? { provider: input.provider } : {}),
      ...(input.baseUrl !== undefined ? { baseUrl: input.baseUrl } : {}),
      ...(secretUpdate ? { secretRef: secretUpdate.secretRef } : {}),
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
