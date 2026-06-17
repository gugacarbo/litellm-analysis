import type { Prisma } from "@lite-llm/model-proxy-repository";
import { getModelProxyPrisma } from "./client";

export interface ProxySpendLogsQueryParams {
  model?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

function buildWhereClause(
  params: Pick<ProxySpendLogsQueryParams, "model" | "startDate" | "endDate">,
): Prisma.ModelProxyRequestWhereInput {
  const where: Prisma.ModelProxyRequestWhereInput = {};

  if (params.model) {
    where.model = params.model;
  }

  if (params.startDate || params.endDate) {
    where.startedAt = {};
    if (params.startDate) {
      where.startedAt.gte = new Date(params.startDate);
    }
    if (params.endDate) {
      where.startedAt.lte = new Date(params.endDate);
    }
  }

  return where;
}

const messagesInclude = {
  messages: {
    orderBy: {
      createdAt: "asc" as const,
    },
  },
} satisfies Prisma.ModelProxyRequestInclude;

export async function getSpendLogs(params: ProxySpendLogsQueryParams) {
  const prisma = getModelProxyPrisma();
  const effectiveLimit = params.limit === 0 ? 1000 : (params.limit ?? 50);
  const offset = params.offset ?? 0;

  return prisma.modelProxyRequest.findMany({
    where: buildWhereClause(params),
    include: messagesInclude,
    orderBy: { startedAt: "desc" },
    take: effectiveLimit,
    skip: offset,
  });
}

export async function getSpendLogsCount(
  params: Pick<ProxySpendLogsQueryParams, "model" | "startDate" | "endDate">,
): Promise<number> {
  const prisma = getModelProxyPrisma();

  return prisma.modelProxyRequest.count({
    where: buildWhereClause(params),
  });
}

export async function getSpendLogDetail(requestId: string) {
  const prisma = getModelProxyPrisma();

  return prisma.modelProxyRequest.findUnique({
    where: { id: requestId },
    include: messagesInclude,
  });
}
