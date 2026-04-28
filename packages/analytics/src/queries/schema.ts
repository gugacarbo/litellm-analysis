import {
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const spendLogs = pgTable("LiteLLM_SpendLogs", {
  requestId: varchar("request_id", { length: 255 }).primaryKey(),
  model: varchar("model", { length: 255 }).notNull(),
  callType: varchar("call_type", { length: 50 }),
  apiBase: varchar("api_base", { length: 500 }),
  user: varchar("user", { length: 255 }),
  teamId: varchar("team_id", { length: 255 }),
  endUser: varchar("end_user", { length: 255 }),
  organizationId: varchar("organization_id", { length: 255 }),
  totalTokens: integer("total_tokens"),
  promptTokens: integer("prompt_tokens"),
  completionTokens: integer("completion_tokens"),
  spend: real("spend").notNull().default(0),
  startTime: timestamp("startTime", { withTimezone: true }).notNull(),
  endTime: timestamp("endTime", { withTimezone: true }),
  completionStartTime: timestamp("completionStartTime", { withTimezone: true }),
  requestDurationMs: integer("request_duration_ms"),
  apiKey: varchar("api_key", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  cacheHit: varchar("cache_hit", { length: 50 }),
  cacheKey: varchar("cache_key", { length: 500 }),
  metadata: jsonb("metadata"),
  proxyServerRequest: jsonb("proxy_server_request"),
  response: jsonb("response"),
  requestTags: jsonb("request_tags"),
  requesterIpAddress: varchar("requester_ip_address", { length: 100 }),
  sessionId: varchar("session_id", { length: 255 }),
  agentId: varchar("agent_id", { length: 255 }),
  modelId: varchar("model_id", { length: 255 }),
  modelGroup: varchar("model_group", { length: 255 }),
  customLlmProvider: varchar("custom_llm_provider", { length: 50 }),
  mcpNamespacedToolName: varchar("mcp_namespaced_tool_name", { length: 255 }),
  messages: jsonb("messages"),
});

export type SpendLog = typeof spendLogs.$inferSelect;
export type NewSpendLog = typeof spendLogs.$inferInsert;

export const proxyModelTable = pgTable("LiteLLM_ProxyModelTable", {
  modelName: varchar("model_name", { length: 255 }).primaryKey(),
  litellmParams: jsonb("litellm_params"),
});

export type ProxyModelTable = typeof proxyModelTable.$inferSelect;
export type NewProxyModelTable = typeof proxyModelTable.$inferInsert;

export const errorLogs = pgTable("LiteLLM_ErrorLogs", {
  requestId: varchar("request_id", { length: 255 }).primaryKey(),
  exceptionType: varchar("exception_type", { length: 255 }),
  litellmModelName: varchar("litellm_model_name", { length: 255 }),
  requestKwargs: jsonb("request_kwargs"),
  exceptionString: text("exception_string"),
  startTime: timestamp("startTime", { withTimezone: true }).notNull(),
  statusCode: integer("status_code"),
});

export type ErrorLog = typeof errorLogs.$inferSelect;
export type NewErrorLog = typeof errorLogs.$inferInsert;

export const liteLLMConfig = pgTable("LiteLLM_Config", {
  paramName: varchar("param_name", { length: 255 }).primaryKey(),
  paramValue: jsonb("param_value"),
});
