import {
  getSpendByKey,
  getSpendByModel,
  getSpendByUser,
  getSpendLogById,
  getSpendLogs,
  getSpendLogsCount,
} from "../queries/index";
import type {
  ChatMessage,
  SpendByKey,
  SpendByModel,
  SpendByUser,
  SpendLogEntry,
  SpendLogsFilters,
  SpendLogsResponse,
  TimeRangeParams,
} from "../types/index";
import { toNullableNumber } from "./utils";

export async function getSpendByModelImpl(
  params: TimeRangeParams = {},
): Promise<SpendByModel[]> {
  const result = await getSpendByModel(params);
  return result.map((item) => ({
    model: item.model,
    total_spend: Number(item.total_spend),
  }));
}

export async function getSpendByUserImpl(
  params: TimeRangeParams = {},
): Promise<SpendByUser[]> {
  const result = await getSpendByUser(params);
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

  const logs = (result as Array<Record<string, unknown>>).map((item) => ({
    request_id: String(item.request_id ?? ""),
    model: String(item.model ?? ""),
    user: item.user as string | null,
    total_tokens: item.total_tokens as number | null,
    prompt_tokens: item.prompt_tokens as number | null,
    completion_tokens: item.completion_tokens as number | null,
    spend: Number(item.spend),
    time_to_first_token_ms: toNullableNumber(item.time_to_first_token_ms),
    start_time: item.startTime
      ? new Date(item.startTime as string | number | Date).toISOString()
      : "",
    end_time: item.endTime
      ? new Date(item.endTime as string | number | Date).toISOString()
      : null,
    api_key: item.api_key as string | null,
    status: item.status as string,
    call_type: (item.call_type ?? null) as string | null,
    api_base: (item.api_base ?? null) as string | null,
    cache_hit: (item.cache_hit ?? null) as string | null,
    metadata: (item.metadata ?? null) as Record<string, unknown> | null,
    proxy_server_request: (item.proxy_server_request ?? null) as Record<
      string,
      unknown
    > | null,
    response: (item.response ?? null) as Record<string, unknown> | null,
    request_tags: (item.request_tags ?? null) as string[] | null,
    model_group: (item.model_group ?? null) as string | null,
    custom_llm_provider: (item.custom_llm_provider ?? null) as string | null,
    messages: (item.messages ?? null) as ChatMessage[] | null,
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
  const rawItem = (await getSpendLogById(requestId)) as
    | Record<string, unknown>
    | undefined;
  if (!rawItem) {
    throw new Error(`Spend log not found: ${requestId}`);
  }
  const item = rawItem;
  return {
    request_id: String(item.request_id ?? ""),
    model: String(item.model ?? ""),
    call_type: (item.call_type ?? null) as string | null,
    api_base: (item.api_base ?? null) as string | null,
    user: (item.user ?? null) as string | null,
    team_id: (item.team_id ?? null) as string | null,
    end_user: (item.end_user ?? null) as string | null,
    organization_id: (item.organization_id ?? null) as string | null,
    total_tokens: (item.total_tokens ?? null) as number | null,
    prompt_tokens: (item.prompt_tokens ?? null) as number | null,
    completion_tokens: (item.completion_tokens ?? null) as number | null,
    spend: Number(item.spend),
    time_to_first_token_ms: toNullableNumber(item.time_to_first_token_ms),
    start_time: item.start_time
      ? new Date(item.start_time as string | number | Date).toISOString()
      : "",
    end_time: item.end_time
      ? new Date(item.end_time as string | number | Date).toISOString()
      : null,
    completion_start_time: item.completion_start_time
      ? new Date(
          item.completion_start_time as string | number | Date,
        ).toISOString()
      : null,
    request_duration_ms: (item.request_duration_ms ?? null) as number | null,
    api_key: (item.api_key ?? null) as string | null,
    status: item.status as string,
    cache_hit: (item.cache_hit ?? null) as string | null,
    cache_key: (item.cache_key ?? null) as string | null,
    metadata: (item.metadata ?? null) as Record<string, unknown> | null,
    proxy_server_request: (item.proxy_server_request ?? null) as Record<
      string,
      unknown
    > | null,
    response: (item.response ?? null) as Record<string, unknown> | null,
    request_tags: (item.request_tags ?? null) as string[] | null,
    requester_ip_address: (item.requester_ip_address ?? null) as string | null,
    session_id: (item.session_id ?? null) as string | null,
    agent_id: (item.agent_id ?? null) as string | null,
    model_id: (item.model_id ?? null) as string | null,
    model_group: (item.model_group ?? null) as string | null,
    custom_llm_provider: (item.custom_llm_provider ?? null) as string | null,
    mcp_namespaced_tool_name: (item.mcp_namespaced_tool_name ?? null) as
      | string
      | null,
    messages: (item.messages ?? null) as ChatMessage[] | null,
  };
}
