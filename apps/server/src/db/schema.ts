import {
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * LiteLLM_SpendLogs - Main table for tracking LLM API usage and spend
 */
export const spendLogs = pgTable('LiteLLM_SpendLogs', {
  requestId: varchar('request_id', { length: 255 }).primaryKey(),
  model: varchar('model', { length: 255 }).notNull(),
  user: varchar('user', { length: 255 }),
  totalTokens: integer('total_tokens'),
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  spend: real('spend').notNull().default(0),
  startTime: timestamp('startTime', { withTimezone: true }).notNull(),
  endTime: timestamp('endTime', { withTimezone: true }),
  apiKey: varchar('api_key', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
});

export type SpendLog = typeof spendLogs.$inferSelect;
export type NewSpendLog = typeof spendLogs.$inferInsert;

/**
 * LiteLLM_ProxyModelTable - Model configuration and pricing
 */
export const proxyModelTable = pgTable('LiteLLM_ProxyModelTable', {
  modelName: varchar('model_name', { length: 255 }).primaryKey(),
  litellmParams: jsonb('litellm_params'),
});

export type ProxyModelTable = typeof proxyModelTable.$inferSelect;
export type NewProxyModelTable = typeof proxyModelTable.$inferInsert;

/**
 * LiteLLM_ErrorLogs - Error tracking table
 */
export const errorLogs = pgTable('LiteLLM_ErrorLogs', {
  requestId: varchar('request_id', { length: 255 }).primaryKey(),
  exceptionType: varchar('exception_type', { length: 255 }),
  litellmModelName: varchar('litellm_model_name', { length: 255 }),
  requestKwargs: jsonb('request_kwargs'),
  exceptionString: text('exception_string'),
  startTime: timestamp('startTime', { withTimezone: true }).notNull(),
  statusCode: integer('status_code'),
});

export type ErrorLog = typeof errorLogs.$inferSelect;
export type NewErrorLog = typeof errorLogs.$inferInsert;

/**
 * LiteLLM_Config - General configuration key-value store
 */
export const liteLLMConfig = pgTable('LiteLLM_Config', {
  paramName: varchar('param_name', { length: 255 }).primaryKey(),
  paramValue: jsonb('param_value'),
});

// Type aliases for queries
export interface SpendByModelResult {
  model: string;
  total_spend: number;
}

export interface SpendLogsResult {
  request_id: string;
  model: string;
  user: string;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  spend: number;
  startTime: Date;
  endTime: Date | null;
  api_key: string | null;
  status: string;
}

export interface SpendByUserResult {
  user: string;
  total_spend: number;
  total_tokens: number;
}

export interface SpendByKeyResult {
  key: string;
  total_spend: number;
  total_tokens: number;
}

export interface ModelDetailsResult {
  model_name: string;
  input_cost_per_token: string;
  output_cost_per_token: string;
}

export interface ErrorLogsResult {
  id: string;
  error_type: string;
  model: string;
  user: string;
  error_message: string;
  timestamp: Date;
  status_code: number;
}
