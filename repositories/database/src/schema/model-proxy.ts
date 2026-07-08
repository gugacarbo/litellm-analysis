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

export const modelProxyUsageAdjustments = pgTable(
  "model_proxy_usage_adjustments",
  {
    id: text("id").primaryKey(),
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
    id: text("id").primaryKey(),
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

export const modelProxyReasoningApis = pgTable(
  "model_proxy_reasoning_apis",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").unique().notNull(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => modelProxyProviders.id, { onDelete: "cascade" }),
    version: text("version").notNull(),
    requestParams: jsonb("request_params"),
    requestShape: jsonb("request_shape"),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
);

export const modelProxyModels = pgTable(
  "model_proxy_models",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    modelId: text("model_id").notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    displayName: text("display_name"),
    family: text("family"),
    canonicalSlug: text("canonical_slug"),
    description: text("description"),
    contextLength: integer("context_length"),
    maxCompletionTokens: integer("max_completion_tokens"),
    knowledgeCutoff: text("knowledge_cutoff"),
    expirationDate: text("expiration_date"),
    architecture: jsonb("architecture"),
    reasoning: jsonb("reasoning"),
    supportedParameters: jsonb("supported_parameters"),
    defaultParameters: jsonb("default_parameters"),
    perRequestLimits: jsonb("per_request_limits"),
    pricing: jsonb("pricing"),
    requestOptions: jsonb("request_options"),
    providerId: uuid("provider_id").references(
      () => modelProxyProviders.id,
      { onDelete: "set null" },
    ),
    reasoningApiId: uuid("reasoning_api_id").references(
      () => modelProxyReasoningApis.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("uq_model_proxy_models_provider_model").on(
      table.providerId,
      table.modelId,
    ),
    index("idx_model_proxy_models_enabled_id").on(
      table.enabled,
      table.modelId,
    ),
  ],
);

export const modelProxyProviders = pgTable("model_proxy_providers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").unique().notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
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

export const modelProxyBenchmarks = pgTable(
  "model_proxy_benchmarks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    aaModelId: text("aa_model_id").notNull(),
    source: text("source").notNull(),
    name: text("name").notNull(),
    slug: text("slug"),
    creatorId: text("creator_id"),
    creatorName: text("creator_name").notNull(),
    creatorSlug: text("creator_slug"),
    intelligenceIndex: doublePrecision("intelligence_index"),
    codingIndex: doublePrecision("coding_index"),
    mathIndex: doublePrecision("math_index"),
    mmluPro: doublePrecision("mmlu_pro"),
    gpqa: doublePrecision("gpqa"),
    hle: doublePrecision("hle"),
    livecodebench: doublePrecision("livecodebench"),
    scicode: doublePrecision("scicode"),
    math500: doublePrecision("math_500"),
    aime: doublePrecision("aime"),
    aime25: doublePrecision("aime_25"),
    tau2: doublePrecision("tau2"),
    ifbench: doublePrecision("ifbench"),
    lcr: doublePrecision("lcr"),
    terminalbenchHard: doublePrecision("terminalbench_hard"),
    priceInput1mTokens: doublePrecision("price_input_1m_tokens"),
    priceOutput1mTokens: doublePrecision("price_output_1m_tokens"),
    priceBlended1mTokens: doublePrecision("price_blended_1m_tokens"),
    medianOutputTokensPerSecond: doublePrecision(
      "median_output_tokens_per_second",
    ),
    medianTtftSeconds: doublePrecision("median_ttft_seconds"),
    medianTtftAnswerSeconds: doublePrecision("median_ttft_answer_seconds"),
    sourceUrl: text("source_url").notNull(),
    fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_model_proxy_benchmarks_aa_model_id_source").on(
      table.aaModelId,
      table.source,
    ),
  ],
);

export type ModelProxyRequest = typeof modelProxyRequests.$inferSelect;
export type NewModelProxyRequest = typeof modelProxyRequests.$inferInsert;
export type ModelProxyUsageAdjustment =
  typeof modelProxyUsageAdjustments.$inferSelect;
export type NewModelProxyUsageAdjustment =
  typeof modelProxyUsageAdjustments.$inferInsert;
export type ModelProxyMessage = typeof modelProxyMessages.$inferSelect;
export type NewModelProxyMessage = typeof modelProxyMessages.$inferInsert;
export type ModelProxyReasoningApi =
  typeof modelProxyReasoningApis.$inferSelect;
export type NewModelProxyReasoningApi =
  typeof modelProxyReasoningApis.$inferInsert;
export type ModelProxyModel = typeof modelProxyModels.$inferSelect;
export type NewModelProxyModel = typeof modelProxyModels.$inferInsert;
export type ModelProxyProvider = typeof modelProxyProviders.$inferSelect;
export type NewModelProxyProvider = typeof modelProxyProviders.$inferInsert;
export type ModelProxyApiKey = typeof modelProxyApiKeys.$inferSelect;
export type NewModelProxyApiKey = typeof modelProxyApiKeys.$inferInsert;
export type ModelProxySetting = typeof modelProxySettings.$inferSelect;
export type NewModelProxySetting = typeof modelProxySettings.$inferInsert;
export type ModelProxyBenchmark = typeof modelProxyBenchmarks.$inferSelect;
export type NewModelProxyBenchmark = typeof modelProxyBenchmarks.$inferInsert;
