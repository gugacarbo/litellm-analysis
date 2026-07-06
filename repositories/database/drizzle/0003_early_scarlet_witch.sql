ALTER TABLE "model_proxy_benchmarks" DROP CONSTRAINT "model_proxy_benchmarks_aa_model_id_unique";--> statement-breakpoint
ALTER TABLE "model_proxy_benchmarks" ADD COLUMN "source" text DEFAULT 'artificial-analysis' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_model_proxy_benchmarks_aa_model_id_source" ON "model_proxy_benchmarks" USING btree ("aa_model_id","source");