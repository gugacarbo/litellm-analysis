import type { Prisma } from "@lite-llm/model-proxy-repository";
import { getModelProxyPrisma } from "./client";
import {
  adjustedTotalCostSql,
  adjustedTotalTokensSql,
  buildProxyWhereClause,
  PROXY_REQUESTS_TABLE,
  proxyAdjustmentsJoin,
} from "./helpers";

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
  usageAdjustments: {
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
  const conditions: string[] = [];
  if (params.model) {
    conditions.push(`r."model" = '${params.model.replace(/'/g, "''")}'`);
  }
  if (params.startDate) {
    conditions.push(`r."started_at" >= '${params.startDate}'`);
  }
  if (params.endDate) {
    conditions.push(`r."started_at" <= '${params.endDate}'`);
  }
  const where = buildProxyWhereClause(conditions);
  const errorWhere = where
    ? `${where} AND r."status" IN ('failed', 'timeout')`
    : `WHERE r."status" IN ('failed', 'timeout')`;

  const [aggregateResult, errorResult] = await Promise.all([
    prisma.$queryRawUnsafe<
      Array<{
        request_count: number;
        total_tokens: number;
        total_cost: number;
        avg_latency_ms: number;
      }>
    >(`
      SELECT
        COUNT(*)::float as "request_count",
        COALESCE(SUM(${adjustedTotalTokensSql("r")}), 0)::float as "total_tokens",
        COALESCE(SUM(${adjustedTotalCostSql("r")}), 0)::float as "total_cost",
        COALESCE(AVG(r."latency_ms"), 0)::float as "avg_latency_ms"
      FROM "${PROXY_REQUESTS_TABLE}" r
      ${proxyAdjustmentsJoin("r")}
      ${where}
    `),
    prisma.$queryRawUnsafe<Array<{ error_count: number }>>(`
      SELECT COUNT(*)::float as "error_count"
      FROM "${PROXY_REQUESTS_TABLE}" r
      ${errorWhere}
    `),
  ]);

  const aggregate = aggregateResult[0];
  const errors = errorResult[0];

  return {
    request_count: Number(aggregate?.request_count ?? 0),
    total_tokens: Number(aggregate?.total_tokens ?? 0),
    total_cost: Number(aggregate?.total_cost ?? 0),
    error_count: Number(errors?.error_count ?? 0),
    avg_latency_ms: Math.round(Number(aggregate?.avg_latency_ms ?? 0)),
  };
}
