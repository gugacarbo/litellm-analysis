import { db, getDb, disconnectDb, queryRaw } from "@lite-llm/database/client";

export { db, getDb, disconnectDb as disconnectModelProxyPrisma, queryRaw };

export function getModelProxyPrisma() {
  return getDb();
}

export type PrismaClient = ReturnType<typeof getDb>;

export namespace Prisma {
  export type JsonValue = unknown;
  export type InputJsonValue = unknown;
  export type ModelProxyRequestWhereInput = Record<string, unknown>;
  export type ModelProxyRequestInclude = Record<string, unknown>;
  export type ModelProxyRequestUpdateInput = Record<string, unknown>;
  export type ModelProxyRequestCreateInput = Record<string, unknown>;
  export type ModelProxyModelUpdateInput = Record<string, unknown>;
  export type ModelProxyModelCreateInput = Record<string, unknown>;
  export type ModelProxyModelUncheckedCreateInput = Record<string, unknown>;
  export type ModelProxyModelUncheckedUpdateInput = Record<string, unknown>;
  export type SortOrder = "asc" | "desc";
  export type ModelProxyRequestOrderByWithRelationInput = Record<string, unknown>;
  export type ModelProxySettingUpdateInput = Record<string, unknown>;
  export type ModelProxySettingCreateInput = Record<string, unknown>;
  export type ModelProxySettingWhereInput = Record<string, unknown>;
  export type ModelProxyModelWhereInput = Record<string, unknown>;
  export type ModelProxyModelWhereUniqueInput = Record<string, unknown>;
  export type ModelProxyProviderWhereInput = Record<string, unknown>;
  export type ModelProxyProviderWhereUniqueInput = Record<string, unknown>;
  export type ModelProxyApiKeyWhereInput = Record<string, unknown>;
  export type ModelProxyApiKeyWhereUniqueInput = Record<string, unknown>;
  export type ModelProxyApiKeyUpdateInput = Record<string, unknown>;
  export type ModelProxyProviderUpdateInput = Record<string, unknown>;
  export type ModelProxyProviderCreateInput = Record<string, unknown>;
  export type ModelProxyApiKeyCreateInput = Record<string, unknown>;
  export type ModelProxySettingWhereUniqueInput = Record<string, unknown>;
  export const DbNull = "DbNull";
  export const JsonNull = "JsonNull";
  export const AnyNull = "AnyNull";
}
