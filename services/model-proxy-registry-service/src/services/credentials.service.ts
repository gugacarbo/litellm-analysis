import type { PrismaClient } from "@lite-llm/model-proxy-repository";
import { CredentialsRepository } from "../repositories/credentials-repository.js";
import type {
  CredentialCreateInput,
  CredentialRecord,
  CredentialUpdateInput,
} from "../types/credentials.js";

export interface CredentialsServiceOptions {
  prisma?: PrismaClient;
  repository?: CredentialsRepository;
}

function assertNoRawApiKey(
  input: CredentialCreateInput | CredentialUpdateInput,
): void {
  if ("apiKey" in input && input.apiKey !== undefined) {
    throw new Error(
      "Raw apiKey is not allowed; use secretRef (env var name) instead",
    );
  }
}

function assertSecretRef(secretRef: string | undefined, action: string): void {
  const trimmed = secretRef?.trim();
  if (!trimmed) {
    throw new Error(`secretRef is required to ${action} a credential`);
  }
}

export interface ICredentialsService {
  get(name: string): Promise<CredentialRecord | null>;
  list(): Promise<CredentialRecord[]>;
  create(input: CredentialCreateInput): Promise<CredentialRecord>;
  update(name: string, input: CredentialUpdateInput): Promise<CredentialRecord>;
  delete(name: string): Promise<boolean>;
}

export class CredentialsService implements ICredentialsService {
  private readonly repository: CredentialsRepository;

  constructor(options: CredentialsServiceOptions = {}) {
    this.repository =
      options.repository ??
      new CredentialsRepository(
        options.prisma ??
          (() => {
            throw new Error("CredentialsService requires prisma or repository");
          })(),
      );
  }

  async get(name: string): Promise<CredentialRecord | null> {
    return this.repository.findByName(name);
  }

  async list(): Promise<CredentialRecord[]> {
    return this.repository.list();
  }

  async create(input: CredentialCreateInput): Promise<CredentialRecord> {
    assertNoRawApiKey(input);
    assertSecretRef(input.secretRef, "create");

    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new Error("Credential name must be a non-empty string");
    }

    const existing = await this.repository.findByName(trimmedName);
    if (existing) {
      throw new Error(`Credential "${trimmedName}" already exists`);
    }

    return this.repository.create({
      name: trimmedName,
      provider: input.provider ?? null,
      baseUrl: input.baseUrl ?? null,
      secretRef: input.secretRef.trim(),
    });
  }

  async update(
    name: string,
    input: CredentialUpdateInput,
  ): Promise<CredentialRecord> {
    assertNoRawApiKey(input);

    const existing = await this.repository.findByName(name);
    if (!existing) {
      throw new Error(`Credential "${name}" not found`);
    }

    if (input.secretRef !== undefined) {
      assertSecretRef(input.secretRef, "update");
    }

    const updated = await this.repository.update(name, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.provider !== undefined ? { provider: input.provider } : {}),
      ...(input.baseUrl !== undefined ? { baseUrl: input.baseUrl } : {}),
      ...(input.secretRef !== undefined
        ? { secretRef: input.secretRef.trim() }
        : {}),
    });

    if (!updated) {
      throw new Error(`Credential "${name}" not found`);
    }

    return updated;
  }

  async delete(name: string): Promise<boolean> {
    return this.repository.delete(name);
  }
}
