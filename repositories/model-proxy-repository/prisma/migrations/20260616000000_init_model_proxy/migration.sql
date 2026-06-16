CREATE TABLE "model_proxy_requests" (
  "id" TEXT PRIMARY KEY,
  "upstream_request_id" TEXT,
  "model" TEXT NOT NULL,
  "upstream_model" TEXT NOT NULL,
  "upstream_base_url" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finished_at" TIMESTAMP(3),
  "latency_ms" INTEGER,
  "ttft_ms" INTEGER,
  "input_tokens" INTEGER,
  "output_tokens" INTEGER,
  "total_tokens" INTEGER,
  "estimated_cost_usd" DOUBLE PRECISION,
  "error_summary" TEXT,
  "request_body" JSONB,
  "response_body" JSONB,
  "response_headers" JSONB
);

CREATE INDEX "model_proxy_requests_model_started_at_idx"
  ON "model_proxy_requests" ("model", "started_at");
CREATE INDEX "model_proxy_requests_status_started_at_idx"
  ON "model_proxy_requests" ("status", "started_at");

CREATE TABLE "model_proxy_messages" (
  "id" TEXT PRIMARY KEY,
  "request_id" TEXT NOT NULL REFERENCES "model_proxy_requests" ("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "model_proxy_messages_request_id_created_at_idx"
  ON "model_proxy_messages" ("request_id", "created_at");

CREATE TABLE "model_proxy_models" (
  "id" TEXT PRIMARY KEY,
  "model_name" TEXT NOT NULL UNIQUE,
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "display_name" TEXT,
  "family" TEXT,
  "owned_by" TEXT,
  "api_mode" TEXT,
  "vision" BOOLEAN,
  "context_window_size" INTEGER,
  "max_output_tokens" INTEGER,
  "input_cost_per_token" DOUBLE PRECISION,
  "output_cost_per_token" DOUBLE PRECISION,
  "upstream_model" TEXT,
  "upstream_base_url" TEXT,
  "credential_name" TEXT,
  "secret_ref" TEXT,
  "request_options" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "model_proxy_models_enabled_model_name_idx"
  ON "model_proxy_models" ("enabled", "model_name");

CREATE TABLE "model_proxy_credentials" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "provider" TEXT,
  "base_url" TEXT,
  "api_key" TEXT,
  "secret_ref" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "model_proxy_api_keys" (
  "id" TEXT PRIMARY KEY,
  "label" TEXT NOT NULL,
  "key_hash" TEXT NOT NULL UNIQUE,
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "last_used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "model_proxy_api_keys_enabled_label_idx"
  ON "model_proxy_api_keys" ("enabled", "label");

CREATE TABLE "model_proxy_settings" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "value" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "model_proxy_aliases" (
  "id" TEXT PRIMARY KEY,
  "alias" TEXT NOT NULL UNIQUE,
  "target_model" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "model_proxy_import_jobs" (
  "id" TEXT PRIMARY KEY,
  "source" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finished_at" TIMESTAMP(3),
  "summary" JSONB,
  "error" TEXT
);

CREATE INDEX "model_proxy_import_jobs_status_started_at_idx"
  ON "model_proxy_import_jobs" ("status", "started_at");
