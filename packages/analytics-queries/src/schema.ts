import {
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

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

export const proxyModelTable = pgTable('LiteLLM_ProxyModelTable', {
  modelName: varchar('model_name', { length: 255 }).primaryKey(),
  litellmParams: jsonb('litellm_params'),
});

export type ProxyModelTable = typeof proxyModelTable.$inferSelect;
export type NewProxyModelTable = typeof proxyModelTable.$inferInsert;

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

export const liteLLMConfig = pgTable('LiteLLM_Config', {
  paramName: varchar('param_name', { length: 255 }).primaryKey(),
  paramValue: jsonb('param_value'),
});
