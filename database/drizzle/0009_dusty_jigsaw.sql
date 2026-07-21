CREATE TABLE "benchmark_snapshot_entries" (
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
CREATE TABLE "benchmark_snapshots" (
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
ALTER TABLE "benchmark_snapshot_entries" ADD CONSTRAINT "benchmark_snapshot_entries_snapshot_id_benchmark_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."benchmark_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_benchmark_snapshot_entries_snapshot_external" ON "benchmark_snapshot_entries" USING btree ("snapshot_id","external_id");--> statement-breakpoint
CREATE INDEX "idx_benchmark_snapshot_entries_subsource" ON "benchmark_snapshot_entries" USING btree ("subsource");--> statement-breakpoint
CREATE INDEX "idx_benchmark_snapshot_entries_provider" ON "benchmark_snapshot_entries" USING btree ("provider");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_benchmark_snapshots_catalog" ON "benchmark_snapshots" USING btree ("catalog");