CREATE TABLE IF NOT EXISTS "model_proxy_usage_adjustments" (
  "id" TEXT NOT NULL,
  "request_id" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "prompt_tokens_delta" INTEGER NOT NULL DEFAULT 0,
  "completion_tokens_delta" INTEGER NOT NULL DEFAULT 0,
  "total_cost_delta" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "model_proxy_usage_adjustments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "model_proxy_usage_adjustments_request_id_created_at_idx"
  ON "model_proxy_usage_adjustments" ("request_id", "created_at");

ALTER TABLE "model_proxy_usage_adjustments"
  ADD CONSTRAINT "model_proxy_usage_adjustments_request_id_fkey"
  FOREIGN KEY ("request_id") REFERENCES "model_proxy_requests" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
