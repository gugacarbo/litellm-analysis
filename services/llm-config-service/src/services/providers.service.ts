import type { DatabaseClient } from "@lite-llm/database/client";
import { looksLikeEnvVarName } from "../lib/provider-secrets.js";
import { ProvidersRepository } from "../repositories/providers-repository.js";
import type {
  ProviderCreateInput,
  ProviderRecord,
  ProviderUpdateInput,
} from "../types/providers.js";

export interface ProvidersServiceOptions {
  db?: DatabaseClient;
  repository?: ProvidersRepository;
}

function normalizeSecretInput(
  input: ProviderCreateInput | ProviderUpdateInput,
  action: string,
): { secretRef: string } {
  const secretRef = input.secretRef?.trim() ?? "";
  if (!secretRef) {
    throw new Error(`secretRef is required to ${action} a provider`);
  }

  if (!looksLikeEnvVarName(secretRef)) {
    throw new Error("secretRef must be an environment variable name");
  }

  return { secretRef };
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

  constructor(options: ProvidersServiceOptions = {}) {
    this.repository =
      options.repository ??
      new ProvidersRepository(
        options.db ??
          (() => {
            throw new Error("ProvidersService requires db or repository");
          })(),
      );
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

    const secret = normalizeSecretInput(input, "create");
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
        ? normalizeSecretInput(input, "update")
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
