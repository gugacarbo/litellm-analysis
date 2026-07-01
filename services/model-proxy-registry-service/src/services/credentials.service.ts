import type { PrismaClient } from "@lite-llm/model-proxy-repository";
import {
  encryptCredentialSecret,
  isEncryptedCredentialSecret,
  looksLikeEnvVarName,
  parseCredentialEncryptionKey,
} from "../lib/credential-secrets.js";
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

function normalizeSecretInput(
  input: CredentialCreateInput | CredentialUpdateInput,
  action: string,
): { apiKey?: string; secretRef?: string } {
  const apiKey = input.apiKey?.trim() ?? "";
  const secretRef = input.secretRef?.trim() ?? "";

  const normalizedSecretRef =
    secretRef && looksLikeEnvVarName(secretRef) ? secretRef : "";
  const normalizedApiKey =
    apiKey || (secretRef && !looksLikeEnvVarName(secretRef) ? secretRef : "");

  if (!normalizedApiKey && !normalizedSecretRef) {
    throw new Error(
      `apiKey or secretRef is required to ${action} a credential`,
    );
  }

  if (normalizedApiKey && normalizedSecretRef) {
    throw new Error("Provide either apiKey or secretRef, not both");
  }

  return normalizedApiKey
    ? { apiKey: normalizedApiKey }
    : { secretRef: normalizedSecretRef };
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
  private encryptionKey: Buffer | null = null;

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

  private getEncryptionKey(): Buffer {
    if (!this.encryptionKey) {
      this.encryptionKey = parseCredentialEncryptionKey();
    }
    return this.encryptionKey;
  }

  private async migrateStoredSecretIfNeeded(
    record: CredentialRecord,
  ): Promise<CredentialRecord> {
    const rawApiKey = record.apiKey?.trim() ?? "";
    if (rawApiKey && !isEncryptedCredentialSecret(rawApiKey)) {
      const updated = await this.repository.update(record.name, {
        apiKey: encryptCredentialSecret(rawApiKey, this.getEncryptionKey()),
      });
      return updated ?? record;
    }

    const secretRef = record.secretRef?.trim() ?? "";
    if (secretRef && !looksLikeEnvVarName(secretRef)) {
      const updated = await this.repository.update(record.name, {
        apiKey: encryptCredentialSecret(secretRef, this.getEncryptionKey()),
        secretRef: null,
      });
      return updated ?? record;
    }

    return record;
  }

  async get(name: string): Promise<CredentialRecord | null> {
    const record = await this.repository.findByName(name);
    if (!record) {
      return null;
    }
    return this.migrateStoredSecretIfNeeded(record);
  }

  async list(): Promise<CredentialRecord[]> {
    const records = await this.repository.list();
    return Promise.all(
      records.map((record) => this.migrateStoredSecretIfNeeded(record)),
    );
  }

  async create(input: CredentialCreateInput): Promise<CredentialRecord> {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new Error("Credential name must be a non-empty string");
    }

    const existing = await this.repository.findByName(trimmedName);
    if (existing) {
      throw new Error(`Credential "${trimmedName}" already exists`);
    }

    const secret = normalizeSecretInput(input, "create");
    return this.repository.create({
      name: trimmedName,
      provider: input.provider ?? null,
      baseUrl: input.baseUrl ?? null,
      ...(secret.apiKey
        ? {
            apiKey: encryptCredentialSecret(
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
    input: CredentialUpdateInput,
  ): Promise<CredentialRecord> {
    const existing = await this.repository.findByName(name);
    if (!existing) {
      throw new Error(`Credential "${name}" not found`);
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
            apiKey: encryptCredentialSecret(
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
      throw new Error(`Credential "${name}" not found`);
    }

    return updated;
  }

  async delete(name: string): Promise<boolean> {
    return this.repository.delete(name);
  }
}
