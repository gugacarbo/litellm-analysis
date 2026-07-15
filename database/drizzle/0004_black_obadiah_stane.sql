ALTER TABLE "application_secrets_store" DROP CONSTRAINT "ck_application_secrets_store_key_allowlist";--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'model_proxy_providers'
      AND column_name = 'credential_envelope'
  ) THEN
    EXECUTE $migration$
      INSERT INTO "application_secrets_store" ("id", "key", "credential_envelope", "created_at", "updated_at")
      SELECT gen_random_uuid(), 'provider:' || "id", "credential_envelope", "created_at", "updated_at"
      FROM "model_proxy_providers"
      WHERE "credential_envelope" IS NOT NULL
      ON CONFLICT ("key") DO UPDATE SET
        "credential_envelope" = EXCLUDED."credential_envelope",
        "updated_at" = EXCLUDED."updated_at"
    $migration$;
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "model_proxy_providers" DROP COLUMN IF EXISTS "credential_envelope";--> statement-breakpoint
ALTER TABLE "application_secrets_store" ADD CONSTRAINT "ck_application_secrets_store_key_allowlist" CHECK ("application_secrets_store"."key" IN ('artificial_analysis_api_key', 'openrouter_api_key') OR "application_secrets_store"."key" ~ '^provider:[0-9a-fA-F-]{36}$');
