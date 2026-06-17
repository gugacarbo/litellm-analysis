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

export interface SpendTotalsFilters {
  model?: string;
  startDate?: string;
  endDate?: string;
}

export interface SpendTotals {
  request_count: number;
  total_tokens: number;
  total_cost: number;
  error_count: number;
  avg_latency_ms: number;
}

export async function getSpendTotals(
  params: SpendTotalsFilters,
): Promise<SpendTotals> {
  const prisma = getModelProxyPrisma();
  const where = buildWhereClause(params);

  const [aggregate, errorCount] = await Promise.all([
    prisma.modelProxyRequest.aggregate({
      where,
      _count: { _all: true },
      _sum: { totalTokens: true, totalCost: true },
      _avg: { latencyMs: true },
    }),
    prisma.modelProxyRequest.count({
      where: {
        ...where,
        status: { in: ["failed", "timeout"] },
      },
    }),
  ]);

  return {
    request_count: aggregate._count._all,
    total_tokens: Number(aggregate._sum.totalTokens ?? 0),
    total_cost: Number(aggregate._sum.totalCost ?? 0),
    error_count: errorCount,
    avg_latency_ms: Math.round(Number(aggregate._avg.latencyMs ?? 0)),
  };
}
