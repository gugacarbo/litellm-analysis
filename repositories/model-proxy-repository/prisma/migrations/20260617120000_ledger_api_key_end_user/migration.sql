ALTER TABLE "model_proxy_requests"
  ADD COLUMN IF NOT EXISTS "api_key_alias" TEXT,
  ADD COLUMN IF NOT EXISTS "end_user" TEXT;

CREATE INDEX IF NOT EXISTS "model_proxy_requests_api_key_alias_started_at_idx"
  ON "model_proxy_requests" ("api_key_alias", "started_at");

CREATE INDEX IF NOT EXISTS "model_proxy_requests_end_user_started_at_idx"
  ON "model_proxy_requests" ("end_user", "started_at");
