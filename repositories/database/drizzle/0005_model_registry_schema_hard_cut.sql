-- Create model_proxy_reasoning_apis table
CREATE TABLE "model_proxy_reasoning_apis" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "provider_id" uuid NOT NULL,
  "version" text NOT NULL,
  "request_params" jsonb,
  "request_shape" jsonb,
  "description" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "model_proxy_reasoning_apis" ADD CONSTRAINT "model_proxy_reasoning_apis_pkey" PRIMARY KEY ("id");--> statement-breakpoint

ALTER TABLE "model_proxy_reasoning_apis" ADD CONSTRAINT "model_proxy_reasoning_apis_slug_unique" UNIQUE ("slug");--> statement-breakpoint

ALTER TABLE "model_proxy_reasoning_apis" ADD CONSTRAINT "model_proxy_reasoning_apis_provider_id_model_proxy_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."model_proxy_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Drop old unique constraint on model_proxy_models
DROP INDEX IF EXISTS "uq_model_proxy_models_model_provider";--> statement-breakpoint

-- Drop old index
DROP INDEX IF EXISTS "idx_model_proxy_models_enabled_name";--> statement-breakpoint

-- Rename model_name to model_id
ALTER TABLE "model_proxy_models" RENAME COLUMN "model_name" TO "model_id";--> statement-breakpoint

-- Drop removed columns
ALTER TABLE "model_proxy_models" DROP COLUMN "owned_by";--> statement-breakpoint

ALTER TABLE "model_proxy_models" DROP COLUMN "vision";--> statement-breakpoint

ALTER TABLE "model_proxy_models" DROP COLUMN "context_window_size";--> statement-breakpoint

ALTER TABLE "model_proxy_models" DROP COLUMN "input_cost_per_token";--> statement-breakpoint

ALTER TABLE "model_proxy_models" DROP COLUMN "output_cost_per_token";--> statement-breakpoint

ALTER TABLE "model_proxy_models" DROP COLUMN "upstream_model";--> statement-breakpoint

ALTER TABLE "model_proxy_models" DROP COLUMN "upstream_base_url";--> statement-breakpoint

ALTER TABLE "model_proxy_models" DROP COLUMN "provider_name";--> statement-breakpoint

ALTER TABLE "model_proxy_models" DROP COLUMN "metadata";--> statement-breakpoint

-- Add new columns
ALTER TABLE "model_proxy_models" ADD COLUMN "canonical_slug" text;--> statement-breakpoint

ALTER TABLE "model_proxy_models" ADD COLUMN "description" text;--> statement-breakpoint

ALTER TABLE "model_proxy_models" ADD COLUMN "context_length" integer;--> statement-breakpoint

ALTER TABLE "model_proxy_models" ADD COLUMN "max_completion_tokens" integer;--> statement-breakpoint

ALTER TABLE "model_proxy_models" ADD COLUMN "knowledge_cutoff" text;--> statement-breakpoint

ALTER TABLE "model_proxy_models" ADD COLUMN "expiration_date" text;--> statement-breakpoint

ALTER TABLE "model_proxy_models" ADD COLUMN "architecture" jsonb;--> statement-breakpoint

ALTER TABLE "model_proxy_models" ADD COLUMN "reasoning" jsonb;--> statement-breakpoint

ALTER TABLE "model_proxy_models" ADD COLUMN "supported_parameters" jsonb;--> statement-breakpoint

ALTER TABLE "model_proxy_models" ADD COLUMN "default_parameters" jsonb;--> statement-breakpoint

ALTER TABLE "model_proxy_models" ADD COLUMN "per_request_limits" jsonb;--> statement-breakpoint

ALTER TABLE "model_proxy_models" ADD COLUMN "pricing" jsonb;--> statement-breakpoint

ALTER TABLE "model_proxy_models" ADD COLUMN "provider_id" uuid;--> statement-breakpoint

ALTER TABLE "model_proxy_models" ADD COLUMN "reasoning_api_id" uuid;--> statement-breakpoint

ALTER TABLE "model_proxy_models" ADD CONSTRAINT "model_proxy_models_provider_id_model_proxy_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."model_proxy_providers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "model_proxy_models" ADD CONSTRAINT "model_proxy_models_reasoning_api_id_model_proxy_reasoning_apis_id_fk" FOREIGN KEY ("reasoning_api_id") REFERENCES "public"."model_proxy_reasoning_apis"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- Create new unique index on (provider_id, model_id)
CREATE UNIQUE INDEX "uq_model_proxy_models_provider_model" ON "model_proxy_models" USING btree ("provider_id","model_id");--> statement-breakpoint

-- Create new index on (enabled, model_id)
CREATE INDEX "idx_model_proxy_models_enabled_id" ON "model_proxy_models" USING btree ("enabled","model_id");
