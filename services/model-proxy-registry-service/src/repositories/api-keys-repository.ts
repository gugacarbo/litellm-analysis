import type { PrismaClient } from "@lite-llm/model-proxy-repository";
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
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findById(id: string): Promise<ApiKeyRecord | null> {
    const row = await this.prisma.modelProxyApiKey.findUnique({
      where: { id },
    });
    return row ? toRecord(row) : null;
  }

  async findByHash(keyHash: string): Promise<ApiKeyRecord | null> {
    const row = await this.prisma.modelProxyApiKey.findUnique({
      where: { keyHash },
    });
    return row ? toRecord(row) : null;
  }

  async listEnabled(): Promise<ApiKeyRecord[]> {
    const rows = await this.prisma.modelProxyApiKey.findMany({
      where: { enabled: true },
      orderBy: { label: "asc" },
    });
    return rows.map(toRecord);
  }

  async list(): Promise<ApiKeyRecord[]> {
    const rows = await this.prisma.modelProxyApiKey.findMany({
      orderBy: { label: "asc" },
    });
    return rows.map(toRecord);
  }

  async create(data: ApiKeyCreateData): Promise<ApiKeyRecord> {
    const row = await this.prisma.modelProxyApiKey.create({
      data: {
        label: data.label,
        keyHash: data.keyHash,
        enabled: data.enabled ?? true,
      },
    });
    return toRecord(row);
  }

  async setEnabled(id: string, enabled: boolean): Promise<ApiKeyRecord | null> {
    try {
      const row = await this.prisma.modelProxyApiKey.update({
        where: { id },
        data: { enabled },
      });
      return toRecord(row);
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as { code?: string }).code === "P2025"
      ) {
        return null;
      }
      throw error;
    }
  }

  async updateLastUsedAt(id: string, at: Date): Promise<void> {
    await this.prisma.modelProxyApiKey.update({
      where: { id },
      data: { lastUsedAt: at },
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.modelProxyApiKey.delete({ where: { id } });
      return true;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as { code?: string }).code === "P2025"
      ) {
        return false;
      }
      throw error;
    }
  }
}
