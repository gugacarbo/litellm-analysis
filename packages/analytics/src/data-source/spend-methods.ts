import {
  getSpendByKey,
  getSpendByModel,
  getSpendByUser,
  getSpendLogById,
  getSpendLogs,
  getSpendLogsCount,
} from "../queries/index.js";
import type {
  SpendByKey,
  SpendByModel,
  SpendByUser,
  SpendLogEntry,
  SpendLogsFilters,
  SpendLogsResponse,
} from "../types/index.js";
import { toNullableNumber } from "./utils.js";

export async function getSpendByModelImpl(days = 30): Promise<SpendByModel[]> {
  const result = await getSpendByModel(days);
  return result.map((item) => ({
    model: item.model,
    total_spend: Number(item.total_spend),
  }));
}

export async function getSpendByUserImpl(days = 30): Promise<SpendByUser[]> {
  const result = await getSpendByUser(days);
  return result.map((item) => ({
    user: item.user,
    total_spend: Number(item.total_spend),
    total_tokens: Number(item.total_tokens || 0),
    request_count: Number(item.request_count || 0),
  }));
}

export async function getSpendByKeyImpl(days = 30): Promise<SpendByKey[]> {
  const result = await getSpendByKey(days);
  return result.map((item) => ({
    key: item.key,
    total_spend: Number(item.total_spend),
    total_tokens: Number(item.total_tokens || 0),
  }));
}

export async function getSpendLogsCountImpl(
  filters: SpendLogsFilters,
): Promise<number> {
  return getSpendLogsCount({
    model: filters.model,
    user: filters.user,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });
}

export async function getSpendLogsImpl(
  filters: SpendLogsFilters,
  getSpendLogsCountFn: (filters: SpendLogsFilters) => Promise<number>,
): Promise<SpendLogsResponse> {
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const [result, total] = await Promise.all([
    getSpendLogs({
      model: filters.model,
      user: filters.user,
      startDate: filters.startDate,
      endDate: filters.endDate,
      limit,
      offset,
    }),
    getSpendLogsCountFn(filters),
  ]);

  const logs = result.map((item) => ({
    request_id: item.request_id,
    model: item.model,
    user: item.user,
    total_tokens: item.total_tokens,
    prompt_tokens: item.prompt_tokens,
    completion_tokens: item.completion_tokens,
    spend: Number(item.spend),
    time_to_first_token_ms: toNullableNumber(item.time_to_first_token_ms),
    start_time: item.startTime ? new Date(item.startTime).toISOString() : "",
    end_time: item.endTime ? new Date(item.endTime).toISOString() : null,
    api_key: item.api_key,
    status: item.status,
    call_type: item.call_type ?? null,
    api_base: item.api_base ?? null,
    cache_hit: item.cache_hit ?? null,
    metadata: (item.metadata ?? null) as Record<string, unknown> | null,
    proxy_server_request: (item.proxy_server_request ?? null) as Record<
      string,
      unknown
    > | null,
    response: (item.response ?? null) as Record<string, unknown> | null,
    request_tags: (item.request_tags ?? null) as string[] | null,
    model_group: item.model_group ?? null,
    custom_llm_provider: item.custom_llm_provider ?? null,
    messages: (item.messages ?? null) as Array<{
      role: string;
      content: string;
    }> | null,
  }));

  return {
    logs,
    pagination: {
      total,
      page: Math.floor(offset / limit) + 1,
      page_size: limit,
      total_pages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}

export async function getSpendLogDetailImpl(
  requestId: string,
): Promise<SpendLogEntry> {
  const item = await getSpendLogById(requestId);
  if (!item) {
    throw new Error(`Spend log not found: ${requestId}`);
  }
  return {
    request_id: item.request_id,
    model: item.model,
    call_type: item.call_type ?? null,
    api_base: item.api_base ?? null,
    user: item.user ?? null,
    team_id: item.team_id ?? null,
    end_user: item.end_user ?? null,
    organization_id: item.organization_id ?? null,
    total_tokens: item.total_tokens ?? null,
    prompt_tokens: item.prompt_tokens ?? null,
    completion_tokens: item.completion_tokens ?? null,
    spend: Number(item.spend),
    time_to_first_token_ms: toNullableNumber(item.time_to_first_token_ms),
    start_time: item.start_time ? new Date(item.start_time).toISOString() : "",
    end_time: item.end_time ? new Date(item.end_time).toISOString() : null,
    completion_start_time: item.completion_start_time
      ? new Date(item.completion_start_time).toISOString()
      : null,
    request_duration_ms: item.request_duration_ms ?? null,
    api_key: item.api_key ?? null,
    status: item.status,
    cache_hit: item.cache_hit ?? null,
    cache_key: item.cache_key ?? null,
    metadata: (item.metadata ?? null) as Record<string, unknown> | null,
    proxy_server_request: (item.proxy_server_request ?? null) as Record<
      string,
      unknown
    > | null,
    response: (item.response ?? null) as Record<string, unknown> | null,
    request_tags: (item.request_tags ?? null) as string[] | null,
    requester_ip_address: item.requester_ip_address ?? null,
    session_id: item.session_id ?? null,
    agent_id: item.agent_id ?? null,
    model_id: item.model_id ?? null,
    model_group: item.model_group ?? null,
    custom_llm_provider: item.custom_llm_provider ?? null,
    mcp_namespaced_tool_name: item.mcp_namespaced_tool_name ?? null,
    messages: (item.messages ?? null) as Array<{
      role: string;
      content: string;
    }> | null,
  };
}
