import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const modelProxyRequests = pgTable(
  "model_proxy_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
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

export const modelProxyUsageAdjustments = pgTable(
  "model_proxy_usage_adjustments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestId: text("request_id")
      .notNull()
      .references(() => modelProxyRequests.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    promptTokensDelta: integer("prompt_tokens_delta").default(0).notNull(),
    completionTokensDelta: integer("completion_tokens_delta")
      .default(0)
      .notNull(),
    totalCostDelta: doublePrecision("total_cost_delta").default(0).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_usage_adjustments_request_created").on(
      table.requestId,
      table.createdAt,
    ),
  ],
);

export const modelProxyMessages = pgTable(
  "model_proxy_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestId: text("request_id")
      .notNull()
      .references(() => modelProxyRequests.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: jsonb("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_messages_request_created").on(table.requestId, table.createdAt),
  ],
);

export const modelProxyModels = pgTable(
  "model_proxy_models",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    modelName: text("model_name").notNull(),
    isDefaultProvider: boolean("is_default_provider").default(false).notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    displayName: text("display_name"),
    family: text("family"),
    ownedBy: text("owned_by"),
    apiMode: text("api_mode"),
    vision: boolean("vision"),
    contextWindowSize: integer("context_window_size"),
    maxOutputTokens: integer("max_output_tokens"),
    inputCostPerToken: doublePrecision("input_cost_per_token"),
    outputCostPerToken: doublePrecision("output_cost_per_token"),
    upstreamModel: text("upstream_model"),
    upstreamBaseUrl: text("upstream_base_url"),
    providerName: text("provider_name").references(
      () => modelProxyProviders.name,
      { onDelete: "set null" },
    ),
    secretRef: text("secret_ref"),
    requestOptions: jsonb("request_options"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("uq_model_proxy_models_model_provider").on(
      table.modelName,
      table.providerName,
    ),
    index("idx_model_proxy_models_enabled_name").on(
      table.enabled,
      table.modelName,
    ),
  ],
);

export const modelProxyProviders = pgTable("model_proxy_providers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").unique().notNull(),
  provider: text("provider"),
  baseUrl: text("base_url"),
  apiKey: text("api_key"),
  secretRef: text("secret_ref"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const modelProxyApiKeys = pgTable(
  "model_proxy_api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    label: text("label").notNull(),
    keyHash: text("key_hash").unique().notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_api_keys_enabled_label").on(table.enabled, table.label),
  ],
);

export const modelProxySettings = pgTable("model_proxy_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").unique().notNull(),
  value: jsonb("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type ModelProxyRequest = typeof modelProxyRequests.$inferSelect;
export type NewModelProxyRequest = typeof modelProxyRequests.$inferInsert;
export type ModelProxyUsageAdjustment =
  typeof modelProxyUsageAdjustments.$inferSelect;
export type NewModelProxyUsageAdjustment =
  typeof modelProxyUsageAdjustments.$inferInsert;
export type ModelProxyMessage = typeof modelProxyMessages.$inferSelect;
export type NewModelProxyMessage = typeof modelProxyMessages.$inferInsert;
export type ModelProxyModel = typeof modelProxyModels.$inferSelect;
export type NewModelProxyModel = typeof modelProxyModels.$inferInsert;
export type ModelProxyProvider = typeof modelProxyProviders.$inferSelect;
export type NewModelProxyProvider = typeof modelProxyProviders.$inferInsert;
export type ModelProxyApiKey = typeof modelProxyApiKeys.$inferSelect;
export type NewModelProxyApiKey = typeof modelProxyApiKeys.$inferInsert;
export type ModelProxySetting = typeof modelProxySettings.$inferSelect;
export type NewModelProxySetting = typeof modelProxySettings.$inferInsert;
