ALTER TABLE "model_proxy_providers" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "model_proxy_providers" AS "providers"
SET "is_default" = true
FROM (
  SELECT DISTINCT "provider_name"
  FROM "model_proxy_models"
  WHERE "is_default_provider" = true
    AND "provider_name" IS NOT NULL
) AS "defaults"
WHERE "providers"."name" = "defaults"."provider_name";--> statement-breakpoint
UPDATE "model_proxy_providers" AS "providers"
SET "secret_ref" = "source"."secret_ref"
FROM (
  SELECT DISTINCT ON ("provider_name")
    "provider_name",
    "secret_ref"
  FROM "model_proxy_models"
  WHERE "provider_name" IS NOT NULL
    AND "secret_ref" IS NOT NULL
    AND btrim("secret_ref") <> ''
  ORDER BY "provider_name", "updated_at" DESC, "created_at" DESC
) AS "source"
WHERE "providers"."name" = "source"."provider_name"
  AND ("providers"."secret_ref" IS NULL OR btrim("providers"."secret_ref") = '');--> statement-breakpoint
ALTER TABLE "model_proxy_models" DROP COLUMN "is_default_provider";--> statement-breakpoint
ALTER TABLE "model_proxy_models" DROP COLUMN "secret_ref";
