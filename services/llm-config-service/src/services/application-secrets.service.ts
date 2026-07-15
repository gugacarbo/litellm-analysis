import type { DatabaseClient } from "@lite-llm/database/client";
import {
  encryptProviderSecret,
  parseProviderEncryptionKey,
  resolveProviderCredential,
} from "../lib/provider-secrets.js";
import {
  APPLICATION_SECRET_KEYS,
  type ApplicationSecretKey,
  ApplicationSecretsRepository,
  type ApplicationSecretsRepositoryPort,
  isApplicationSecretKey,
} from "../repositories/application-secrets-repository.js";

export type { ApplicationSecretKey, ApplicationSecretsRepositoryPort };

export interface ApplicationSecretPublic {
  key: ApplicationSecretKey;
  isConfigured: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface ApplicationSecretsServiceOptions {
  db?: DatabaseClient;
  repository?: ApplicationSecretsRepositoryPort;
  encryptionKey?: Buffer;
}

export interface IApplicationSecretsService {
  list(): Promise<ApplicationSecretPublic[]>;
  replace(
    key: ApplicationSecretKey,
    plaintext: string,
  ): Promise<ApplicationSecretPublic>;
  remove(key: ApplicationSecretKey): Promise<ApplicationSecretPublic>;
  resolve(key: ApplicationSecretKey): Promise<string | null>;
}

function assertApplicationSecretKey(
  value: string,
): asserts value is ApplicationSecretKey {
  if (!isApplicationSecretKey(value)) {
    throw new Error("Unsupported application secret key");
  }
}

function toUnconfigured(key: ApplicationSecretKey): ApplicationSecretPublic {
  return {
    key,
    isConfigured: false,
    createdAt: null,
    updatedAt: null,
  };
}

export class ApplicationSecretsService implements IApplicationSecretsService {
  private readonly repository: ApplicationSecretsRepositoryPort;
  private readonly encryptionKey: Buffer | undefined;

  constructor(options: ApplicationSecretsServiceOptions = {}) {
    this.repository =
      options.repository ??
      new ApplicationSecretsRepository(
        options.db ??
          (() => {
            throw new Error(
              "ApplicationSecretsService requires db or repository",
            );
          })(),
      );
    this.encryptionKey = options.encryptionKey;
  }

  async list(): Promise<ApplicationSecretPublic[]> {
    return Promise.all(
      APPLICATION_SECRET_KEYS.map(async (key) => {
        const row = await this.repository.findByKey(key);
        return row
          ? {
              key,
              isConfigured: true,
              createdAt: row.createdAt,
              updatedAt: row.updatedAt,
            }
          : toUnconfigured(key);
      }),
    );
  }

  async replace(
    key: ApplicationSecretKey,
    plaintext: string,
  ): Promise<ApplicationSecretPublic> {
    assertApplicationSecretKey(key);
    if (!plaintext.trim()) {
      throw new Error("Application secret must be a non-empty string");
    }

    const record = await this.repository.upsert({
      key,
      credentialEnvelope: encryptProviderSecret(
        plaintext,
        this.getEncryptionKey(),
      ),
    });
    return {
      key: record.key,
      isConfigured: true,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async remove(key: ApplicationSecretKey): Promise<ApplicationSecretPublic> {
    assertApplicationSecretKey(key);
    await this.repository.deleteByKey(key);
    return toUnconfigured(key);
  }

  async resolve(key: ApplicationSecretKey): Promise<string | null> {
    assertApplicationSecretKey(key);
    const record = await this.repository.findByKey(key);
    if (!record) {
      return null;
    }

    try {
      return resolveProviderCredential(
        { credentialEnvelope: record.credentialEnvelope },
        this.getEncryptionKey(),
      );
    } catch {
      return null;
    }
  }

  private getEncryptionKey(): Buffer {
    return this.encryptionKey ?? parseProviderEncryptionKey();
  }
}
