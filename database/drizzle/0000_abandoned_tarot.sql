CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"anomaly_type" text NOT NULL,
	"model" text,
	"severity" text NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"detected_at" timestamp NOT NULL,
	"acknowledged_at" timestamp,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_health_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_name" text NOT NULL,
	"status" text NOT NULL,
	"response_time_ms" integer,
	"ttft_ms" integer,
	"output_tokens" integer,
	"tokens_per_second" double precision,
	"status_code" integer,
	"prompt_sent" text NOT NULL,
	"response_received" text,
	"request_payload" jsonb,
	"response_payload" jsonb,
	"error_message" text,
	"source" text DEFAULT 'scheduled' NOT NULL,
	"checked_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_proxy_api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"key_hash" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "model_proxy_api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "model_proxy_benchmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aa_model_id" text NOT NULL,
	"source" text NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"creator_id" text,
	"creator_name" text NOT NULL,
	"creator_slug" text,
	"intelligence_index" double precision,
	"coding_index" double precision,
	"math_index" double precision,
	"mmlu_pro" double precision,
	"gpqa" double precision,
	"hle" double precision,
	"livecodebench" double precision,
	"scicode" double precision,
	"math_500" double precision,
	"aime" double precision,
	"aime_25" double precision,
	"tau2" double precision,
	"ifbench" double precision,
	"lcr" double precision,
	"terminalbench_hard" double precision,
	"price_input_1m_tokens" double precision,
	"price_output_1m_tokens" double precision,
	"price_blended_1m_tokens" double precision,
	"median_output_tokens_per_second" double precision,
	"median_ttft_seconds" double precision,
	"median_ttft_answer_seconds" double precision,
	"source_url" text NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_proxy_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"role" text NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_proxy_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"display_name" text,
	"family" text,
	"canonical_slug" text,
	"description" text,
	"context_length" integer,
	"max_completion_tokens" integer,
	"knowledge_cutoff" text,
	"expiration_date" text,
	"architecture" jsonb,
	"reasoning" jsonb,
	"supported_parameters" jsonb,
	"default_parameters" jsonb,
	"per_request_limits" jsonb,
	"pricing" jsonb,
	"request_options" jsonb,
	"provider_id" uuid,
	"reasoning_api_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_proxy_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"provider" text,
	"base_url" text,
	"api_key" text,
	"secret_ref" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "model_proxy_providers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "model_proxy_reasoning_apis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"provider_id" uuid NOT NULL,
	"version" text NOT NULL,
	"request_params" jsonb,
	"request_shape" jsonb,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "model_proxy_reasoning_apis_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "model_proxy_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"upstream_request_id" text,
	"model" text NOT NULL,
	"upstream_model" text NOT NULL,
	"upstream_base_url" text NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"latency_ms" integer,
	"ttft_ms" integer,
	"input_tokens" integer,
	"output_tokens" integer,
	"total_tokens" integer,
	"cached_tokens" integer,
	"reasoning_tokens" integer,
	"usage_estimated" boolean,
	"input_cost_per_token" double precision,
	"output_cost_per_token" double precision,
	"input_cost" double precision,
	"output_cost" double precision,
	"total_cost" double precision,
	"cost_estimated" boolean,
	"estimated_cost_usd" double precision,
	"error_summary" text,
	"error_type" text,
	"error_message" text,
	"error_status_code" integer,
	"error_details" jsonb,
	"request_body" jsonb,
	"response_body" jsonb,
	"response_headers" jsonb,
	"api_key_alias" text,
	"end_user" text
);
--> statement-breakpoint
CREATE TABLE "model_proxy_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "model_proxy_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "model_proxy_usage_adjustments" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"reason" text NOT NULL,
	"prompt_tokens_delta" integer DEFAULT 0 NOT NULL,
	"completion_tokens_delta" integer DEFAULT 0 NOT NULL,
	"total_cost_delta" double precision DEFAULT 0 NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "model_proxy_messages" ADD CONSTRAINT "model_proxy_messages_request_id_model_proxy_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."model_proxy_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_proxy_models" ADD CONSTRAINT "model_proxy_models_provider_id_model_proxy_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."model_proxy_providers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_proxy_models" ADD CONSTRAINT "model_proxy_models_reasoning_api_id_model_proxy_reasoning_apis_id_fk" FOREIGN KEY ("reasoning_api_id") REFERENCES "public"."model_proxy_reasoning_apis"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_proxy_reasoning_apis" ADD CONSTRAINT "model_proxy_reasoning_apis_provider_id_model_proxy_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."model_proxy_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_proxy_usage_adjustments" ADD CONSTRAINT "model_proxy_usage_adjustments_request_id_model_proxy_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."model_proxy_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_api_keys_enabled_label" ON "model_proxy_api_keys" USING btree ("enabled","label");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_model_proxy_benchmarks_aa_model_id_source" ON "model_proxy_benchmarks" USING btree ("aa_model_id","source");--> statement-breakpoint
CREATE INDEX "idx_messages_request_created" ON "model_proxy_messages" USING btree ("request_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_model_proxy_models_provider_model" ON "model_proxy_models" USING btree ("provider_id","model_id");--> statement-breakpoint
CREATE INDEX "idx_model_proxy_models_enabled_id" ON "model_proxy_models" USING btree ("enabled","model_id");--> statement-breakpoint
CREATE INDEX "idx_model_proxy_requests_model_started_at" ON "model_proxy_requests" USING btree ("model","started_at");--> statement-breakpoint
CREATE INDEX "idx_model_proxy_requests_status_started_at" ON "model_proxy_requests" USING btree ("status","started_at");--> statement-breakpoint
CREATE INDEX "idx_model_proxy_requests_apikey_started_at" ON "model_proxy_requests" USING btree ("api_key_alias","started_at");--> statement-breakpoint
CREATE INDEX "idx_model_proxy_requests_enduser_started_at" ON "model_proxy_requests" USING btree ("end_user","started_at");--> statement-breakpoint
CREATE INDEX "idx_usage_adjustments_request_created" ON "model_proxy_usage_adjustments" USING btree ("request_id","created_at");