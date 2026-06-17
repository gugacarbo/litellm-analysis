import type { Prisma } from "@lite-llm/model-proxy-repository";
import { redactPayload } from "@lite-llm/model-proxy-service/logging/payload-redactor";
import { trimErrorMessage } from "@lite-llm/model-proxy-service/logging/request-errors";

export const LITELLM_IMPORT_SOURCE = "litellm-import";

const TERMINAL_LEDGER_STATUSES = new Set([
  "success",
  "failed",
  "cancelled",
  "timeout",
]);

export interface LegacySpendRow {
  requestId: string;
  spend: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  startTime: Date;
  endTime: Date | null;
  requestDurationMs: number | null;
  completionStartTime: Date | null;
  model: string;
  apiBase: string | null;
  status: string | null;
  apiKey: string | null;
  endUser: string | null;
  messages: unknown;
  response: unknown;
  proxyServerRequest: unknown;
  metadata: unknown;
}

export interface LegacyErrorRow {
  requestId: string;
  startTime: Date;
  endTime: Date;
  apiBase: string;
  modelGroup: string;
  litellmModelName: string;
  modelId: string;
  requestKwargs: unknown;
  exceptionType: string;
  exceptionString: string;
  statusCode: string;
}

export interface ModelCostRates {
  inputCostPerToken?: number | null;
  outputCostPerToken?: number | null;
}

export interface MappedProxyMessage {
  requestId: string;
  role: string;
  content: Prisma.InputJsonValue;
}

export interface MappedProxyRequestWrite {
  request: Prisma.ModelProxyRequestCreateInput;
  messages: MappedProxyMessage[];
}

export interface LegacySpendAdapterInput {
  spend?: LegacySpendRow | null;
  error?: LegacyErrorRow | null;
  modelRates?: ModelCostRates;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toInt(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && value.length > 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toFloat(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.length > 0) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toNullableString(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }
  if (value === null || value === undefined) {
    return null;
  }
  return String(value);
}

function parseStatusCode(value: string): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function deriveLatencyMs(
  startTime: Date,
  endTime: Date | null,
  requestDurationMs: number | null,
): number | null {
  if (requestDurationMs !== null && requestDurationMs >= 0) {
    return requestDurationMs;
  }
  if (!endTime) {
    return null;
  }
  const delta = endTime.getTime() - startTime.getTime();
  return delta >= 0 ? Math.round(delta) : null;
}

function deriveTtftMs(
  startTime: Date,
  completionStartTime: Date | null,
): number | null {
  if (!completionStartTime) {
    return null;
  }
  const delta = completionStartTime.getTime() - startTime.getTime();
  return delta >= 0 ? Math.round(delta) : null;
}

function readTokenCountFromMetadata(
  metadata: unknown,
  keys: string[],
): number | null {
  const record = asRecord(metadata);
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.trunc(value);
    }
  }

  const providerUsage = asRecord(record.provider_usage);
  if (providerUsage) {
    for (const key of keys) {
      const value = providerUsage[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        return Math.trunc(value);
      }
    }
  }

  return null;
}

function isCancelledInMetadata(metadata: unknown): boolean {
  const record = asRecord(metadata);
  if (!record) {
    return false;
  }
  const status = record.status;
  if (typeof status === "string" && status.toLowerCase() === "cancelled") {
    return true;
  }
  return record.cancelled === true || record.canceled === true;
}

export function deriveUsageFields(spend: LegacySpendRow): {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  cachedTokens: number | null;
  reasoningTokens: number | null;
  usageEstimated: boolean;
} {
  const inputTokens = spend.promptTokens > 0 ? spend.promptTokens : null;
  const outputTokens =
    spend.completionTokens > 0 ? spend.completionTokens : null;
  const totalTokens = spend.totalTokens > 0 ? spend.totalTokens : null;
  const cachedTokens =
    readTokenCountFromMetadata(spend.metadata, [
      "cached_tokens",
      "cache_read_input_tokens",
    ]) ?? 0;
  const reasoningTokens = readTokenCountFromMetadata(spend.metadata, [
    "reasoning_tokens",
    "completion_tokens_details_reasoning_tokens",
  ]);

  let usageEstimated = false;
  if (!inputTokens && !outputTokens && !totalTokens) {
    usageEstimated = true;
  } else if (totalTokens && !inputTokens && !outputTokens) {
    usageEstimated = true;
  }

  return {
    inputTokens,
    outputTokens,
    totalTokens,
    cachedTokens,
    reasoningTokens,
    usageEstimated,
  };
}

export function deriveCostFields(
  spend: LegacySpendRow,
  usage: ReturnType<typeof deriveUsageFields>,
  modelRates?: ModelCostRates,
): {
  inputCostPerToken: number | null;
  outputCostPerToken: number | null;
  inputCost: number | null;
  outputCost: number | null;
  totalCost: number | null;
  costEstimated: boolean;
  estimatedCostUsd: number | null;
} {
  const inputCostPerToken = modelRates?.inputCostPerToken ?? null;
  const outputCostPerToken = modelRates?.outputCostPerToken ?? null;

  const hasSpend = spend.spend > 0;
  const totalCost = hasSpend ? spend.spend : null;

  let inputCost: number | null = null;
  let outputCost: number | null = null;

  if (
    usage.inputTokens !== null &&
    inputCostPerToken !== null &&
    inputCostPerToken > 0
  ) {
    inputCost = usage.inputTokens * inputCostPerToken;
  }

  if (
    usage.outputTokens !== null &&
    outputCostPerToken !== null &&
    outputCostPerToken > 0
  ) {
    outputCost = usage.outputTokens * outputCostPerToken;
  }

  const calculatedTotal = (inputCost ?? 0) + (outputCost ?? 0);
  const resolvedTotalCost =
    totalCost ?? (calculatedTotal > 0 ? calculatedTotal : null);

  let costEstimated = usage.usageEstimated;
  if (
    !hasSpend &&
    (usage.inputTokens || usage.outputTokens || usage.totalTokens)
  ) {
    costEstimated = true;
  }
  if (!hasSpend && calculatedTotal > 0) {
    costEstimated = true;
  }

  const estimatedCostUsd =
    resolvedTotalCost === null && calculatedTotal > 0 ? calculatedTotal : null;

  return {
    inputCostPerToken,
    outputCostPerToken,
    inputCost,
    outputCost,
    totalCost: resolvedTotalCost,
    costEstimated,
    estimatedCostUsd,
  };
}

export function mapLegacyStatus(
  spend: LegacySpendRow | null | undefined,
  error: LegacyErrorRow | null | undefined,
): string {
  if (spend && isCancelledInMetadata(spend.metadata)) {
    return "cancelled";
  }

  const rawStatus = spend?.status?.toLowerCase() ?? "";
  if (rawStatus === "success") {
    return "success";
  }
  if (rawStatus === "timeout") {
    return "timeout";
  }
  if (rawStatus === "cancelled" || rawStatus === "canceled") {
    return "cancelled";
  }
  if (
    rawStatus === "failure" ||
    rawStatus === "error" ||
    rawStatus === "failed"
  ) {
    return "failed";
  }

  const errorStatusCode = error ? parseStatusCode(error.statusCode) : null;
  if (error || (errorStatusCode !== null && errorStatusCode >= 400)) {
    return "failed";
  }

  if (spend?.endTime) {
    return "success";
  }

  return "started";
}

function buildErrorSummary(exceptionString: string): string {
  const trimmed = exceptionString.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.length > 120 ? trimmed.slice(0, 120) : trimmed;
}

function buildImportErrorDetails(
  error: LegacyErrorRow | null | undefined,
  extra?: Record<string, unknown>,
): Prisma.InputJsonValue {
  const details: Record<string, unknown> = {
    source: LITELLM_IMPORT_SOURCE,
    ...extra,
  };

  if (!error) {
    return details as Prisma.InputJsonValue;
  }

  details.request_kwargs = error.requestKwargs;
  details.litellm_model_name = error.litellmModelName;
  details.model_group = error.modelGroup;
  details.model_id = error.modelId;
  details.api_base = error.apiBase;

  return details as Prisma.InputJsonValue;
}

function resolveUpstreamModel(
  spend: LegacySpendRow | null | undefined,
  error: LegacyErrorRow | null | undefined,
): string {
  if (error?.litellmModelName) {
    return error.litellmModelName;
  }
  return spend?.model || "unknown";
}

function resolveModel(
  spend: LegacySpendRow | null | undefined,
  error: LegacyErrorRow | null | undefined,
): string {
  if (spend?.model) {
    return spend.model;
  }
  if (error?.modelGroup) {
    return error.modelGroup;
  }
  if (error?.litellmModelName) {
    return error.litellmModelName;
  }
  return "unknown";
}

function resolveUpstreamBaseUrl(
  spend: LegacySpendRow | null | undefined,
  error: LegacyErrorRow | null | undefined,
): string {
  return spend?.apiBase ?? error?.apiBase ?? "";
}

export function parseLegacyMessages(
  requestId: string,
  raw: unknown,
): MappedProxyMessage[] {
  if (raw === null || raw === undefined) {
    return [];
  }

  let items: unknown[] = [];
  if (Array.isArray(raw)) {
    items = raw;
  } else {
    const record = asRecord(raw);
    if (record && Array.isArray(record.messages)) {
      items = record.messages;
    }
  }

  return items
    .map((item) => {
      if (typeof item !== "object" || item === null) {
        return {
          requestId,
          role: "unknown",
          content: redactPayload(item) as Prisma.InputJsonValue,
        };
      }

      const message = item as Record<string, unknown>;
      const role = typeof message.role === "string" ? message.role : "unknown";
      const content = message.content !== undefined ? message.content : message;

      return {
        requestId,
        role,
        content: redactPayload(content) as Prisma.InputJsonValue,
      };
    })
    .filter((message) => message.role.length > 0);
}

export function isImportMarkedRow(errorDetails: unknown): boolean {
  const record = asRecord(errorDetails);
  return record?.source === LITELLM_IMPORT_SOURCE;
}

export function isLedgerOwnedRow(existing: {
  errorDetails: unknown;
  status: string;
}): boolean {
  if (isImportMarkedRow(existing.errorDetails)) {
    return false;
  }
  return (
    TERMINAL_LEDGER_STATUSES.has(existing.status) ||
    existing.status === "started"
  );
}

export function shouldSkipExistingRow(
  existing: {
    errorDetails: unknown;
    status: string;
  },
  force: boolean,
): boolean {
  if (isLedgerOwnedRow(existing)) {
    return true;
  }
  return !force;
}

function resolveEndUser(
  spend: LegacySpendRow | null | undefined,
): string | null {
  if (!spend) {
    return null;
  }
  const endUser = spend.endUser?.trim();
  if (endUser) {
    return endUser;
  }
  return null;
}

function resolveApiKeyAlias(
  spend: LegacySpendRow | null | undefined,
): string | null {
  const apiKey = spend?.apiKey?.trim();
  return apiKey ? apiKey : null;
}

export function legacySpendRowFromPrisma(row: {
  request_id: string;
  spend: number;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  startTime: Date;
  endTime: Date;
  request_duration_ms: number | null;
  completionStartTime: Date | null;
  model: string;
  api_base: string | null;
  status: string | null;
  api_key: string | null;
  end_user: string | null;
  user: string | null;
  messages: unknown;
  response: unknown;
  proxy_server_request: unknown;
  metadata: unknown;
}): LegacySpendRow {
  return {
    requestId: row.request_id,
    spend: row.spend,
    totalTokens: row.total_tokens,
    promptTokens: row.prompt_tokens,
    completionTokens: row.completion_tokens,
    startTime: row.startTime,
    endTime: row.endTime,
    requestDurationMs: row.request_duration_ms,
    completionStartTime: row.completionStartTime,
    model: row.model,
    apiBase: row.api_base,
    status: row.status,
    apiKey: row.api_key?.trim() ? row.api_key.trim() : null,
    endUser: row.end_user?.trim() || row.user?.trim() || null,
    messages: row.messages,
    response: row.response,
    proxyServerRequest: row.proxy_server_request,
    metadata: row.metadata,
  };
}

export function legacyErrorRowFromPrisma(row: {
  request_id: string;
  startTime: Date;
  endTime: Date;
  api_base: string;
  model_group: string;
  litellm_model_name: string;
  model_id: string;
  request_kwargs: unknown;
  exception_type: string;
  exception_string: string;
  status_code: string;
}): LegacyErrorRow {
  return {
    requestId: row.request_id,
    startTime: row.startTime,
    endTime: row.endTime,
    apiBase: row.api_base,
    modelGroup: row.model_group,
    litellmModelName: row.litellm_model_name,
    modelId: row.model_id,
    requestKwargs: row.request_kwargs,
    exceptionType: row.exception_type,
    exceptionString: row.exception_string,
    statusCode: row.status_code,
  };
}

export function legacySpendRowFromCloudJson(
  log: Record<string, unknown>,
): LegacySpendRow | null {
  const requestId = toNullableString(log.request_id);
  if (!requestId) {
    return null;
  }

  const startTime = toDate(log.startTime ?? log.start_time);
  if (!startTime) {
    return null;
  }

  return {
    requestId,
    spend: toFloat(log.spend),
    totalTokens: toInt(log.total_tokens),
    promptTokens: toInt(log.prompt_tokens),
    completionTokens: toInt(log.completion_tokens),
    startTime,
    endTime: toDate(log.endTime ?? log.end_time),
    requestDurationMs: toInt(log.request_duration_ms) || null,
    completionStartTime: toDate(
      log.completionStartTime ?? log.completion_start_time,
    ),
    model: toNullableString(log.model) ?? "",
    apiBase: toNullableString(log.api_base),
    status: toNullableString(log.status),
    apiKey: toNullableString(log.api_key),
    endUser:
      toNullableString(log.end_user) ?? toNullableString(log.user) ?? null,
    messages: log.messages ?? null,
    response: log.response ?? null,
    proxyServerRequest: log.proxy_server_request ?? null,
    metadata: log.metadata ?? null,
  };
}

export function mapLegacySpendToProxyRequest(
  input: LegacySpendAdapterInput,
): MappedProxyRequestWrite {
  const { spend, error, modelRates } = input;

  if (!spend && !error) {
    throw new Error("mapLegacySpendToProxyRequest requires spend or error row");
  }

  const requestId = spend?.requestId ?? error?.requestId;
  if (!requestId) {
    throw new Error("Missing request id for legacy spend import row");
  }

  const startedAt = spend?.startTime ?? error?.startTime ?? new Date(0);
  const finishedAt = spend?.endTime ?? error?.endTime ?? null;
  const status = mapLegacyStatus(spend, error);
  const usage = spend
    ? deriveUsageFields(spend)
    : {
        inputTokens: null,
        outputTokens: null,
        totalTokens: null,
        cachedTokens: null,
        reasoningTokens: null,
        usageEstimated: true,
      };
  const cost = spend
    ? deriveCostFields(spend, usage, modelRates)
    : {
        inputCostPerToken: modelRates?.inputCostPerToken ?? null,
        outputCostPerToken: modelRates?.outputCostPerToken ?? null,
        inputCost: null,
        outputCost: null,
        totalCost: null,
        costEstimated: true,
        estimatedCostUsd: null,
      };

  const errorMessage = error?.exceptionString
    ? trimErrorMessage(error.exceptionString)
    : null;

  const request: Prisma.ModelProxyRequestCreateInput = {
    id: requestId,
    upstreamRequestId: null,
    model: resolveModel(spend, error),
    upstreamModel: resolveUpstreamModel(spend, error),
    upstreamBaseUrl: resolveUpstreamBaseUrl(spend, error),
    status,
    apiKeyAlias: resolveApiKeyAlias(spend),
    endUser: resolveEndUser(spend),
    startedAt,
    finishedAt,
    latencyMs: spend
      ? deriveLatencyMs(startedAt, finishedAt, spend.requestDurationMs)
      : deriveLatencyMs(startedAt, finishedAt, null),
    ttftMs: spend ? deriveTtftMs(startedAt, spend.completionStartTime) : null,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens,
    cachedTokens: usage.cachedTokens,
    reasoningTokens: usage.reasoningTokens,
    usageEstimated: usage.usageEstimated,
    inputCostPerToken: cost.inputCostPerToken,
    outputCostPerToken: cost.outputCostPerToken,
    inputCost: cost.inputCost,
    outputCost: cost.outputCost,
    totalCost: cost.totalCost,
    costEstimated: cost.costEstimated,
    estimatedCostUsd: cost.estimatedCostUsd,
    errorSummary: errorMessage ? buildErrorSummary(errorMessage) : null,
    errorType: error?.exceptionType || null,
    errorMessage,
    errorStatusCode: error ? parseStatusCode(error.statusCode) : null,
    errorDetails: buildImportErrorDetails(error),
    requestBody:
      spend?.proxyServerRequest !== undefined &&
      spend.proxyServerRequest !== null
        ? (redactPayload(spend.proxyServerRequest) as Prisma.InputJsonValue)
        : undefined,
    responseBody:
      spend?.response !== undefined && spend.response !== null
        ? (redactPayload(spend.response) as Prisma.InputJsonValue)
        : undefined,
    responseHeaders: undefined,
  };

  const messages = spend ? parseLegacyMessages(requestId, spend.messages) : [];

  return { request, messages };
}
