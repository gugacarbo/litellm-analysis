import type { Prisma, PrismaClient } from "@lite-llm/model-proxy-repository";
import type { ModelProxySettingRecord } from "../types/settings.js";

function toRecord(row: {
  id: string;
  key: string;
  value: Prisma.JsonValue;
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
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findByKey(key: string): Promise<ModelProxySettingRecord | null> {
    const row = await this.prisma.modelProxySetting.findUnique({
      where: { key },
    });
    return row ? toRecord(row) : null;
  }

  async list(): Promise<ModelProxySettingRecord[]> {
    const rows = await this.prisma.modelProxySetting.findMany({
      orderBy: { key: "asc" },
    });
    return rows.map(toRecord);
  }

  async upsert(
    key: string,
    value: Prisma.InputJsonValue,
  ): Promise<ModelProxySettingRecord> {
    const row = await this.prisma.modelProxySetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    return toRecord(row);
  }

  async deleteByKey(key: string): Promise<boolean> {
    try {
      await this.prisma.modelProxySetting.delete({ where: { key } });
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
