import type { db as drizzleDb } from "@lite-llm/database/client";
import { modelProxyProviders } from "@lite-llm/database/schema";
import { asc, eq } from "drizzle-orm";
import type { ProviderRecord } from "../types/providers.js";

function toRecord(row: {
  id: string;
  name: string;
  provider: string | null;
  baseUrl: string | null;
  apiKey: string | null;
  secretRef: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ProviderRecord {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    baseUrl: row.baseUrl,
    secretRef: row.secretRef,
    apiKey: row.apiKey,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export interface ProviderWriteData {
  name: string;
  provider?: string | null;
  baseUrl?: string | null;
  secretRef?: string | null;
}

export interface LegacyProviderImportData {
  name: string;
  provider: string | null;
  baseUrl: string | null;
  secretRef: string | null;
}

export type LegacyProviderImportOutcome = "inserted" | "updated" | "skipped";

export class ProvidersRepository {
  private readonly db: typeof drizzleDb;

  constructor(db: typeof drizzleDb) {
    this.db = db;
  }

  async findByName(name: string): Promise<ProviderRecord | null> {
    const [row] = await this.db
      .select()
      .from(modelProxyProviders)
      .where(eq(modelProxyProviders.name, name))
      .limit(1);
    return row ? toRecord(row) : null;
  }

  async list(): Promise<ProviderRecord[]> {
    const rows = await this.db
      .select()
      .from(modelProxyProviders)
      .orderBy(asc(modelProxyProviders.name));
    return rows.map(toRecord);
  }

  async create(data: ProviderWriteData): Promise<ProviderRecord> {
    const [row] = await this.db
      .insert(modelProxyProviders)
      .values({
        name: data.name,
        provider: data.provider ?? null,
        baseUrl: data.baseUrl ?? null,
        secretRef: data.secretRef ?? null,
      })
      .returning();
    return toRecord(row);
  }

  async update(
    name: string,
    data: Partial<ProviderWriteData>,
  ): Promise<ProviderRecord | null> {
    const [existing] = await this.db
      .select()
      .from(modelProxyProviders)
      .where(eq(modelProxyProviders.name, name))
      .limit(1);
    if (!existing) {
      return null;
    }

    const setData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) setData.name = data.name;
    if (data.provider !== undefined) setData.provider = data.provider;
    if (data.baseUrl !== undefined) setData.baseUrl = data.baseUrl;
    if (data.secretRef !== undefined) setData.secretRef = data.secretRef;

    const [row] = await this.db
      .update(modelProxyProviders)
      .set(setData as never)
      .where(eq(modelProxyProviders.name, name))
      .returning();
    return toRecord(row);
  }

  async delete(name: string): Promise<boolean> {
    const [deleted] = await this.db
      .delete(modelProxyProviders)
      .where(eq(modelProxyProviders.name, name))
      .returning({ id: modelProxyProviders.id });
    return !!deleted;
  }

  async previewLegacyImport(
    data: LegacyProviderImportData,
    force: boolean,
  ): Promise<LegacyProviderImportOutcome> {
    const existing = await this.findByName(data.name);
    if (existing && !force) {
      return "skipped";
    }
    return existing ? "updated" : "inserted";
  }

  async upsertLegacyImport(
    data: LegacyProviderImportData,
    force: boolean,
  ): Promise<LegacyProviderImportOutcome> {
    const existing = await this.findByName(data.name);
    if (existing && !force) {
      return "skipped";
    }

    if (existing) {
      const setData: Record<string, unknown> = {
        provider: data.provider,
        baseUrl: data.baseUrl,
        secretRef: data.secretRef,
        updatedAt: new Date(),
      };
      await this.db
        .update(modelProxyProviders)
        .set(setData as never)
        .where(eq(modelProxyProviders.name, data.name));
      return "updated";
    }

    await this.db.insert(modelProxyProviders).values({
      name: data.name,
      provider: data.provider,
      baseUrl: data.baseUrl,
      secretRef: data.secretRef,
    });
    return "inserted";
  }
}
