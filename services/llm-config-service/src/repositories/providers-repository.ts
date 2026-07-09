import type { db as drizzleDb } from "@lite-llm/database/client";
import { modelProxyProviders } from "@lite-llm/database/schema";
import { asc, eq } from "drizzle-orm";
import type { ProviderRecord } from "../types/providers.js";

function toRecord(row: {
  id: string;
  name: string;
  isDefault: boolean;
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
    isDefault: row.isDefault,
    provider: row.provider,
    baseUrl: row.baseUrl,
    apiKey: row.apiKey,
    secretRef: row.secretRef,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export interface ProviderWriteData {
  name: string;
  isDefault?: boolean;
  provider?: string | null;
  baseUrl?: string | null;
  apiKey?: string | null;
  secretRef?: string | null;
}

export class ProvidersRepository {
  private readonly db: typeof drizzleDb;

  constructor(db: typeof drizzleDb) {
    this.db = db;
  }

  private get providerApi():
    | {
        findUnique?: (args: {
          where: { name: string };
        }) => Promise<ProviderRecord | null>;
        findMany?: () => Promise<ProviderRecord[]>;
        create?: (args: { data: ProviderWriteData }) => Promise<ProviderRecord>;
        update?: (args: {
          where: { name: string };
          data: Partial<ProviderWriteData>;
        }) => Promise<ProviderRecord | null>;
        delete?: (args: {
          where: { name: string };
        }) => Promise<ProviderRecord | null>;
      }
    | undefined {
    return (this.db as { modelProxyProvider?: unknown }).modelProxyProvider as
      | {
          findUnique?: (args: {
            where: { name: string };
          }) => Promise<ProviderRecord | null>;
          findMany?: () => Promise<ProviderRecord[]>;
          create?: (args: {
            data: ProviderWriteData;
          }) => Promise<ProviderRecord>;
          update?: (args: {
            where: { name: string };
            data: Partial<ProviderWriteData>;
          }) => Promise<ProviderRecord | null>;
          delete?: (args: {
            where: { name: string };
          }) => Promise<ProviderRecord | null>;
        }
      | undefined;
  }

  async findByName(name: string): Promise<ProviderRecord | null> {
    const api = this.providerApi;
    if (api?.findUnique) {
      return api.findUnique({ where: { name } });
    }
    const [row] = await this.db
      .select()
      .from(modelProxyProviders)
      .where(eq(modelProxyProviders.name, name))
      .limit(1);
    return row ? toRecord(row) : null;
  }

  async list(): Promise<ProviderRecord[]> {
    const api = this.providerApi;
    if (api?.findMany) {
      return api.findMany();
    }
    const rows = await this.db
      .select()
      .from(modelProxyProviders)
      .orderBy(asc(modelProxyProviders.name));
    return rows.map(toRecord);
  }

  async create(data: ProviderWriteData): Promise<ProviderRecord> {
    const api = this.providerApi;
    if (api?.create) {
      return api.create({ data });
    }
    const [row] = await this.db
      .insert(modelProxyProviders)
      .values({
        name: data.name,
        isDefault: data.isDefault ?? false,
        provider: data.provider ?? null,
        baseUrl: data.baseUrl ?? null,
        apiKey: data.apiKey ?? null,
        secretRef: data.secretRef ?? null,
      })
      .returning();
    return toRecord(row);
  }

  async update(
    name: string,
    data: Partial<ProviderWriteData>,
  ): Promise<ProviderRecord | null> {
    const api = this.providerApi;
    if (api?.update) {
      return api.update({ where: { name }, data });
    }
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
    if (data.isDefault !== undefined) setData.isDefault = data.isDefault;
    if (data.provider !== undefined) setData.provider = data.provider;
    if (data.baseUrl !== undefined) setData.baseUrl = data.baseUrl;
    if (data.apiKey !== undefined) setData.apiKey = data.apiKey;
    if (data.secretRef !== undefined) setData.secretRef = data.secretRef;

    const [row] = await this.db
      .update(modelProxyProviders)
      .set(setData as never)
      .where(eq(modelProxyProviders.name, name))
      .returning();
    return toRecord(row);
  }

  async delete(name: string): Promise<boolean> {
    const api = this.providerApi;
    if (api?.delete) {
      return !!(await api.delete({ where: { name } }));
    }
    const [deleted] = await this.db
      .delete(modelProxyProviders)
      .where(eq(modelProxyProviders.name, name))
      .returning({ id: modelProxyProviders.id });
    return !!deleted;
  }
}
