-- Drop the old unique constraint on model_name
ALTER TABLE "model_proxy"."model_proxy_models" DROP CONSTRAINT IF EXISTS "model_proxy_models_model_name_key";

-- Add is_default_provider column
ALTER TABLE "model_proxy"."model_proxy_models" ADD COLUMN IF NOT EXISTS "is_default_provider" BOOLEAN NOT NULL DEFAULT false;

-- Add composite unique constraint on (model_name, provider_name)
-- PostgreSQL treats NULLs as distinct, so two rows with NULL provider_name and same model_name are allowed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'model_proxy_models_model_name_provider_name_key'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_class
    WHERE relname = 'model_proxy_models_model_name_provider_name_key'
  ) THEN
    ALTER TABLE "model_proxy"."model_proxy_models"
      ADD CONSTRAINT "model_proxy_models_model_name_provider_name_key"
      UNIQUE ("model_name", "provider_name");
  END IF;
END
$$;

-- Add foreign key from provider_name to model_proxy_providers.name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'model_proxy_models_provider_name_fkey'
  ) THEN
    ALTER TABLE "model_proxy"."model_proxy_models"
      ADD CONSTRAINT "model_proxy_models_provider_name_fkey"
      FOREIGN KEY ("provider_name")
      REFERENCES "model_proxy"."model_proxy_providers"("name")
      ON DELETE SET NULL;
  END IF;
END
$$;

-- Partial unique index: at most one default provider per model name
CREATE UNIQUE INDEX IF NOT EXISTS "model_proxy_models_model_name_default_key"
  ON "model_proxy"."model_proxy_models" ("model_name")
  WHERE "is_default_provider" = true;
