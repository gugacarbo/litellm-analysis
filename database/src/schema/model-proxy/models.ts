import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { modelProxyProviders } from "./providers";
import { modelProxyReasoningApis } from "./reasoning-apis";
import type {
  Architecture,
  DefaultParameters,
  PerRequestLimits,
  Pricing,
  Reasoning,
  RequestOptions,
  SupportedParameters,
} from "./types";

export const modelProxyModels = pgTable(
  "model_proxy_models",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    modelId: text("model_id").notNull(),
    revision: integer("revision").default(1).notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    displayName: text("display_name"),
    family: text("family"),
    canonicalSlug: text("canonical_slug"),
    description: text("description"),
    contextLength: integer("context_length"),
    maxCompletionTokens: integer("max_completion_tokens"),
    knowledgeCutoff: text("knowledge_cutoff"),
    expirationDate: text("expiration_date"),
    architecture: jsonb("architecture").$type<Architecture>(),
    reasoning: jsonb("reasoning").$type<Reasoning>(),
    supportedParameters: jsonb(
      "supported_parameters",
    ).$type<SupportedParameters>(),
    defaultParameters: jsonb("default_parameters").$type<DefaultParameters>(),
    perRequestLimits: jsonb("per_request_limits").$type<PerRequestLimits>(),
    pricing: jsonb("pricing").$type<Pricing>(),
    requestOptions: jsonb("request_options").$type<RequestOptions>(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => modelProxyProviders.id, { onDelete: "restrict" }),
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
    index("idx_model_proxy_models_enabled_id").on(table.enabled, table.modelId),
  ],
);

export type ModelProxyModel = typeof modelProxyModels.$inferSelect;
export type NewModelProxyModel = typeof modelProxyModels.$inferInsert;
