import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const modelProxyRequests = pgTable(
  "model_proxy_requests",
  {
    id: text("id").primaryKey(),
    upstreamRequestId: text("upstream_request_id"),
    model: text("model").notNull(),
    upstreamModel: text("upstream_model").notNull(),
    upstreamBaseUrl: text("upstream_base_url").notNull(),
    status: text("status").notNull(),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    finishedAt: timestamp("finished_at"),
    latencyMs: integer("latency_ms"),
    ttftMs: integer("ttft_ms"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    totalTokens: integer("total_tokens"),
    cachedTokens: integer("cached_tokens"),
    reasoningTokens: integer("reasoning_tokens"),
    usageEstimated: boolean("usage_estimated"),
    inputCostPerToken: doublePrecision("input_cost_per_token"),
    outputCostPerToken: doublePrecision("output_cost_per_token"),
    inputCost: doublePrecision("input_cost"),
    outputCost: doublePrecision("output_cost"),
    totalCost: doublePrecision("total_cost"),
    costEstimated: boolean("cost_estimated"),
    estimatedCostUsd: doublePrecision("estimated_cost_usd"),
    errorSummary: text("error_summary"),
    errorType: text("error_type"),
    errorMessage: text("error_message"),
    errorStatusCode: integer("error_status_code"),
    errorDetails: jsonb("error_details"),
    requestBody: jsonb("request_body"),
    responseBody: jsonb("response_body"),
    responseHeaders: jsonb("response_headers"),
    apiKeyAlias: text("api_key_alias"),
    endUser: text("end_user"),
  },
  (table) => [
    index("idx_model_proxy_requests_model_started_at").on(
      table.model,
      table.startedAt,
    ),
    index("idx_model_proxy_requests_status_started_at").on(
      table.status,
      table.startedAt,
    ),
    index("idx_model_proxy_requests_apikey_started_at").on(
      table.apiKeyAlias,
      table.startedAt,
    ),
    index("idx_model_proxy_requests_enduser_started_at").on(
      table.endUser,
      table.startedAt,
    ),
  ],
);

export type ModelProxyRequest = typeof modelProxyRequests.$inferSelect;
export type NewModelProxyRequest = typeof modelProxyRequests.$inferInsert;
