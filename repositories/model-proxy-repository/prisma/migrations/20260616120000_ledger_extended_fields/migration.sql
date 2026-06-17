ALTER TABLE "model_proxy_requests"
  ADD COLUMN "cached_tokens" INTEGER,
  ADD COLUMN "reasoning_tokens" INTEGER,
  ADD COLUMN "usage_estimated" BOOLEAN,
  ADD COLUMN "input_cost_per_token" DOUBLE PRECISION,
  ADD COLUMN "output_cost_per_token" DOUBLE PRECISION,
  ADD COLUMN "input_cost" DOUBLE PRECISION,
  ADD COLUMN "output_cost" DOUBLE PRECISION,
  ADD COLUMN "total_cost" DOUBLE PRECISION,
  ADD COLUMN "cost_estimated" BOOLEAN,
  ADD COLUMN "error_type" TEXT,
  ADD COLUMN "error_message" TEXT,
  ADD COLUMN "error_status_code" INTEGER,
  ADD COLUMN "error_details" JSONB;
