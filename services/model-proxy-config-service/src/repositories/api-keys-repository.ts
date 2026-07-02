import { db as drizzleDb } from "@lite-llm/database/client";
import { modelProxyApiKeys } from "@lite-llm/database/schema";
import { asc, eq } from "drizzle-orm";
import type { ApiKeyRecord } from "../types/api-keys.js";

function toRecord(row: {
  id: string;
  label: string;
  keyHash: string;
  enabled: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ApiKeyRecord {
  return {
    id: row.id,
    label: row.label,
    keyHash: row.keyHash,
    enabled: row.enabled,
    lastUsedAt: row.lastUsedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export interface ApiKeyCreateData {
  label: string;
  keyHash: string;
  enabled?: boolean;
}

export class ApiKeysRepository {
  private readonly db: typeof drizzleDb;

  constructor(db: typeof drizzleDb) {
    this.db = db;
  }

  async findById(id: string): Promise<ApiKeyRecord | null> {
    const [row] = await this.db
      .select()
      .from(modelProxyApiKeys)
      .where(eq(modelProxyApiKeys.id, id))
      .limit(1);
    return row ? toRecord(row) : null;
  }

  async findByHash(keyHash: string): Promise<ApiKeyRecord | null> {
    const [row] = await this.db
      .select()
      .from(modelProxyApiKeys)
      .where(eq(modelProxyApiKeys.keyHash, keyHash))
      .limit(1);
    return row ? toRecord(row) : null;
  }

  async listEnabled(): Promise<ApiKeyRecord[]> {
    const rows = await this.db
      .select()
      .from(modelProxyApiKeys)
      .where(eq(modelProxyApiKeys.enabled, true))
      .orderBy(asc(modelProxyApiKeys.label));
    return rows.map(toRecord);
  }

  async list(): Promise<ApiKeyRecord[]> {
    const rows = await this.db
      .select()
      .from(modelProxyApiKeys)
      .orderBy(asc(modelProxyApiKeys.label));
    return rows.map(toRecord);
  }

  async create(data: ApiKeyCreateData): Promise<ApiKeyRecord> {
    const [row] = await this.db
      .insert(modelProxyApiKeys)
      .values({
        label: data.label,
        keyHash: data.keyHash,
        enabled: data.enabled ?? true,
      })
      .returning();
    return toRecord(row);
  }

  async setEnabled(id: string, enabled: boolean): Promise<ApiKeyRecord | null> {
    const [row] = await this.db
      .update(modelProxyApiKeys)
      .set({ enabled, updatedAt: new Date() })
      .where(eq(modelProxyApiKeys.id, id))
      .returning();
    return row ? toRecord(row) : null;
  }

  async updateLastUsedAt(id: string, at: Date): Promise<void> {
    await this.db
      .update(modelProxyApiKeys)
      .set({ lastUsedAt: at, updatedAt: new Date() })
      .where(eq(modelProxyApiKeys.id, id));
  }

  async delete(id: string): Promise<boolean> {
    const [deleted] = await this.db
      .delete(modelProxyApiKeys)
      .where(eq(modelProxyApiKeys.id, id))
      .returning({ id: modelProxyApiKeys.id });
    return !!deleted;
  }
}
