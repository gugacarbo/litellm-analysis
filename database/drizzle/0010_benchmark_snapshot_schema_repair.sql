-- Repair installations where 0009 was applied without the schema-aware
-- wrapper and therefore created the snapshot tables in public. New installs
-- already receive the tables from 0009 and this migration is a no-op for them.
CREATE TABLE IF NOT EXISTS "benchmark_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalog" text NOT NULL,
	"source_label" text NOT NULL,
	"source_url" text NOT NULL,
	"citation" text,
	"fetched_at" timestamp NOT NULL,
	"count" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "benchmark_snapshot_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"subsource" text,
	"name" text NOT NULL,
	"provider" text,
	"model_permaslug" text,
	"arena" text,
	"category" text,
	"intelligence_index" double precision,
	"elo" double precision,
	"win_rate" double precision,
	"average_time_seconds" double precision,
	"price_input_1m_tokens" double precision,
	"price_output_1m_tokens" double precision,
	"attribution_label" text NOT NULL,
	"attribution_url" text NOT NULL,
	"attribution_citation" text,
	"native" jsonb NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conrelid = 'benchmark_snapshot_entries'::regclass
			AND conname = 'benchmark_snapshot_entries_snapshot_id_benchmark_snapshots_id_fk'
	) THEN
		ALTER TABLE "benchmark_snapshot_entries"
			ADD CONSTRAINT "benchmark_snapshot_entries_snapshot_id_benchmark_snapshots_id_fk"
			FOREIGN KEY ("snapshot_id") REFERENCES "benchmark_snapshots"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_benchmark_snapshot_entries_snapshot_external" ON "benchmark_snapshot_entries" USING btree ("snapshot_id","external_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_benchmark_snapshot_entries_subsource" ON "benchmark_snapshot_entries" USING btree ("subsource");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_benchmark_snapshot_entries_provider" ON "benchmark_snapshot_entries" USING btree ("provider");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_benchmark_snapshots_catalog" ON "benchmark_snapshots" USING btree ("catalog");
--> statement-breakpoint
DO $$
BEGIN
	IF current_schema() <> 'public'
		AND to_regclass('public.benchmark_snapshots') IS NOT NULL
		AND to_regclass('public.benchmark_snapshot_entries') IS NOT NULL THEN
		INSERT INTO "benchmark_snapshots" (
			"id", "catalog", "source_label", "source_url", "citation", "fetched_at", "count", "created_at"
		)
		SELECT
			"id", "catalog", "source_label", "source_url", "citation", "fetched_at", "count", "created_at"
		FROM public."benchmark_snapshots"
		ON CONFLICT ("catalog") DO NOTHING;

		INSERT INTO "benchmark_snapshot_entries" (
			"id", "snapshot_id", "external_id", "subsource", "name", "provider", "model_permaslug",
			"arena", "category", "intelligence_index", "elo", "win_rate", "average_time_seconds",
			"price_input_1m_tokens", "price_output_1m_tokens", "attribution_label", "attribution_url",
			"attribution_citation", "native"
		)
		SELECT
			entry."id", target."id", entry."external_id", entry."subsource", entry."name", entry."provider", entry."model_permaslug",
			entry."arena", entry."category", entry."intelligence_index", entry."elo", entry."win_rate", entry."average_time_seconds",
			entry."price_input_1m_tokens", entry."price_output_1m_tokens", entry."attribution_label", entry."attribution_url",
			entry."attribution_citation", entry."native"
		FROM public."benchmark_snapshot_entries" AS entry
		INNER JOIN public."benchmark_snapshots" AS source ON source."id" = entry."snapshot_id"
		INNER JOIN "benchmark_snapshots" AS target ON target."catalog" = source."catalog"
		ON CONFLICT ("snapshot_id", "external_id") DO NOTHING;
	END IF;
END $$;
