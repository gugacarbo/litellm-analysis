import type { db as drizzleDb } from "@lite-llm/database/client";
import { modelProxySettings } from "@lite-llm/database/schema";
import { asc, eq } from "drizzle-orm";
import type { ModelProxySettingRecord } from "../types/settings.js";

function toRecord(row: {
  id: string;
  key: string;
  value: unknown;
  createdAt: Date;
  updatedAt: Date;
}): ModelProxySettingRecord {
  return {
    id: row.id,
    key: row.key,
    value: row.value,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class SettingsRepository {
  private readonly db: typeof drizzleDb;

  constructor(db: typeof drizzleDb) {
    this.db = db;
  }

  async findByKey(key: string): Promise<ModelProxySettingRecord | null> {
    const [row] = await this.db
      .select()
      .from(modelProxySettings)
      .where(eq(modelProxySettings.key, key))
      .limit(1);
    return row ? toRecord(row) : null;
  }

  async list(): Promise<ModelProxySettingRecord[]> {
    const rows = await this.db
      .select()
      .from(modelProxySettings)
      .orderBy(asc(modelProxySettings.key));
    return rows.map(toRecord);
  }

  async upsert(key: string, value: unknown): Promise<ModelProxySettingRecord> {
    const [row] = await this.db
      .insert(modelProxySettings)
      .values({ key, value: value as never })
      .onConflictDoUpdate({
        target: modelProxySettings.key,
        set: { value: value as never, updatedAt: new Date() },
      })
      .returning();
    return toRecord(row);
  }

  async deleteByKey(key: string): Promise<boolean> {
    const [deleted] = await this.db
      .delete(modelProxySettings)
      .where(eq(modelProxySettings.key, key))
      .returning({ id: modelProxySettings.id });
    return !!deleted;
  }
}
