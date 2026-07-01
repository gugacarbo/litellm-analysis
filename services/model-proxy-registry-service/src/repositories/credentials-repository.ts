import type { PrismaClient } from "@lite-llm/model-proxy-repository";
import type { CredentialRecord } from "../types/credentials.js";

function toRecord(row: {
  id: string;
  name: string;
  provider: string | null;
  baseUrl: string | null;
  apiKey: string | null;
  secretRef: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CredentialRecord {
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

export interface CredentialWriteData {
  name: string;
  provider?: string | null;
  baseUrl?: string | null;
  apiKey?: string | null;
  secretRef?: string | null;
}

export interface LegacyCredentialImportData {
  name: string;
  provider: string | null;
  baseUrl: string | null;
  secretRef: string | null;
}

export type LegacyCredentialImportOutcome = "inserted" | "updated" | "skipped";

export class CredentialsRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findByName(name: string): Promise<CredentialRecord | null> {
    const row = await this.prisma.modelProxyCredential.findUnique({
      where: { name },
    });
    return row ? toRecord(row) : null;
  }

  async list(): Promise<CredentialRecord[]> {
    const rows = await this.prisma.modelProxyCredential.findMany({
      orderBy: { name: "asc" },
    });
    return rows.map(toRecord);
  }

  async create(data: CredentialWriteData): Promise<CredentialRecord> {
    const row = await this.prisma.modelProxyCredential.create({
      data: {
        name: data.name,
        provider: data.provider ?? null,
        baseUrl: data.baseUrl ?? null,
        apiKey: data.apiKey ?? null,
        secretRef: data.secretRef ?? null,
      },
    });
    return toRecord(row);
  }

  async update(
    name: string,
    data: Partial<CredentialWriteData>,
  ): Promise<CredentialRecord | null> {
    try {
      const row = await this.prisma.modelProxyCredential.update({
        where: { name },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.provider !== undefined ? { provider: data.provider } : {}),
          ...(data.baseUrl !== undefined ? { baseUrl: data.baseUrl } : {}),
          ...(data.apiKey !== undefined ? { apiKey: data.apiKey } : {}),
          ...(data.secretRef !== undefined
            ? { secretRef: data.secretRef }
            : {}),
        },
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

  async delete(name: string): Promise<boolean> {
    try {
      await this.prisma.modelProxyCredential.delete({ where: { name } });
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

  async previewLegacyImport(
    data: LegacyCredentialImportData,
    force: boolean,
  ): Promise<LegacyCredentialImportOutcome> {
    const existing = await this.findByName(data.name);
    if (existing && !force) {
      return "skipped";
    }
    return existing ? "updated" : "inserted";
  }

  async upsertLegacyImport(
    data: LegacyCredentialImportData,
    force: boolean,
    options: { allowLegacyApiKey?: boolean; apiKey?: string | null } = {},
  ): Promise<LegacyCredentialImportOutcome> {
    const existing = await this.findByName(data.name);
    if (existing && !force) {
      return "skipped";
    }

    if (existing) {
      await this.prisma.modelProxyCredential.update({
        where: { name: data.name },
        data: {
          provider: data.provider,
          baseUrl: data.baseUrl,
          secretRef: data.secretRef,
          ...(options.allowLegacyApiKey && options.apiKey !== undefined
            ? { apiKey: options.apiKey }
            : {}),
        },
      });
      return "updated";
    }

    await this.prisma.modelProxyCredential.create({
      data: {
        name: data.name,
        provider: data.provider,
        baseUrl: data.baseUrl,
        secretRef: data.secretRef,
        apiKey:
          options.allowLegacyApiKey && options.apiKey ? options.apiKey : null,
      },
    });
    return "inserted";
  }
}
