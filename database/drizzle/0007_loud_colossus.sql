CREATE TABLE "app_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"actor_type" text NOT NULL,
	"actor_id" text,
	"actor_role" text,
	"source" text NOT NULL,
	"request_id" text NOT NULL,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"outcome" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE INDEX "idx_app_audit_events_occurred_at_id" ON "app_audit_events" USING btree ("occurred_at","id");--> statement-breakpoint
CREATE INDEX "idx_app_audit_events_actor_id_occurred_at" ON "app_audit_events" USING btree ("actor_id","occurred_at");--> statement-breakpoint
CREATE INDEX "idx_app_audit_events_resource_type_resource_id_occurred_at" ON "app_audit_events" USING btree ("resource_type","resource_id","occurred_at");