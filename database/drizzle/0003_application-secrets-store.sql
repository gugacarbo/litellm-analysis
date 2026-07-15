CREATE TABLE "application_secrets_store" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"credential_envelope" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ck_application_secrets_store_key_allowlist" CHECK ("application_secrets_store"."key" IN ('artificial_analysis_api_key', 'openrouter_api_key'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_application_secrets_store_key" ON "application_secrets_store" USING btree ("key");