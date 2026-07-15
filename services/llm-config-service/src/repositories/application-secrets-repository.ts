import crypto from "node:crypto";
import type { db as drizzleDb } from "@lite-llm/database/client";
import { applicationSecretsStore } from "@lite-llm/database/schema";
import { eq } from "drizzle-orm";

export const APPLICATION_SECRET_KEYS = [
  "artificial_analysis_api_key",
  "openrouter_api_key",
] as const;

const PROVIDER_SECRET_KEY_PREFIX = "provider:";

export function providerSecretKey(providerId: string): string {
  return `${PROVIDER_SECRET_KEY_PREFIX}${providerId}`;
}

export type ApplicationSecretKey = (typeof APPLICATION_SECRET_KEYS)[number];

export function isApplicationSecretKey(
  value: string,
): value is ApplicationSecretKey {
  return APPLICATION_SECRET_KEYS.includes(value as ApplicationSecretKey);
}

function assertApplicationSecretKey(
  value: string,
): asserts value is ApplicationSecretKey {
  if (!isApplicationSecretKey(value)) {
    throw new Error("Unsupported application secret key");
  }
}

export interface ApplicationSecretRecord {
  key: ApplicationSecretKey;
  credentialEnvelope: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderSecretRecord {
  providerId: string;
  credentialEnvelope: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApplicationSecretUpsertData {
  key: ApplicationSecretKey;
  credentialEnvelope: string;
}

export interface ApplicationSecretsRepositoryPort {
  findByKey(key: ApplicationSecretKey): Promise<ApplicationSecretRecord | null>;
  upsert(data: ApplicationSecretUpsertData): Promise<ApplicationSecretRecord>;
  deleteByKey(key: ApplicationSecretKey): Promise<boolean>;
}

function toRecord(row: {
  key: string;
  credentialEnvelope: string;
  createdAt: Date;
  updatedAt: Date;
}): ApplicationSecretRecord {
  return {
    key: row.key as ApplicationSecretKey,
    credentialEnvelope: row.credentialEnvelope,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class ApplicationSecretsRepository
  implements ApplicationSecretsRepositoryPort
{
  private readonly db: typeof drizzleDb;

  constructor(db: typeof drizzleDb) {
    this.db = db;
  }

  async findByKey(
    key: ApplicationSecretKey,
  ): Promise<ApplicationSecretRecord | null> {
    const [row] = await this.db
      .select()
      .from(applicationSecretsStore)
      .where(eq(applicationSecretsStore.key, key))
      .limit(1);
    return row ? toRecord(row) : null;
  }

  async upsert(
    data: ApplicationSecretUpsertData,
  ): Promise<ApplicationSecretRecord> {
    assertApplicationSecretKey(data.key);
    const [row] = await this.db
      .insert(applicationSecretsStore)
      .values({
        id: crypto.randomUUID(),
        key: data.key,
        credentialEnvelope: data.credentialEnvelope,
      })
      .onConflictDoUpdate({
        target: applicationSecretsStore.key,
        set: {
          credentialEnvelope: data.credentialEnvelope,
          updatedAt: new Date(),
        },
      })
      .returning();
    return toRecord(row);
  }

  async deleteByKey(key: ApplicationSecretKey): Promise<boolean> {
    const [deleted] = await this.db
      .delete(applicationSecretsStore)
      .where(eq(applicationSecretsStore.key, key))
      .returning({ id: applicationSecretsStore.id });
    return !!deleted;
  }

  async findProviderCredential(
    providerId: string,
  ): Promise<ProviderSecretRecord | null> {
    const [row] = await this.db
      .select()
      .from(applicationSecretsStore)
      .where(eq(applicationSecretsStore.key, providerSecretKey(providerId)))
      .limit(1);
    return row
      ? {
          providerId,
          credentialEnvelope: row.credentialEnvelope,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }
      : null;
  }

  async upsertProviderCredential(
    providerId: string,
    credentialEnvelope: string,
  ): Promise<ProviderSecretRecord> {
    const [row] = await this.db
      .insert(applicationSecretsStore)
      .values({
        id: crypto.randomUUID(),
        key: providerSecretKey(providerId),
        credentialEnvelope,
      })
      .onConflictDoUpdate({
        target: applicationSecretsStore.key,
        set: {
          credentialEnvelope,
          updatedAt: new Date(),
        },
      })
      .returning();
    return {
      providerId,
      credentialEnvelope: row.credentialEnvelope,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async deleteProviderCredential(providerId: string): Promise<boolean> {
    const [deleted] = await this.db
      .delete(applicationSecretsStore)
      .where(eq(applicationSecretsStore.key, providerSecretKey(providerId)))
      .returning({ id: applicationSecretsStore.id });
    return !!deleted;
  }
}
