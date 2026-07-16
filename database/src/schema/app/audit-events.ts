import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const appAuditEvents = pgTable(
  "app_audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    occurredAt: timestamp("occurred_at").defaultNow().notNull(),
    actorType: text("actor_type", {
      enum: ["user", "api_key", "system"],
    }).notNull(),
    actorId: text("actor_id"),
    actorRole: text("actor_role", { enum: ["admin", "viewer"] }),
    source: text("source", {
      enum: ["ui", "legacy_api", "proxy", "system"],
    }).notNull(),
    requestId: text("request_id").notNull(),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id"),
    outcome: text("outcome", {
      enum: ["success", "failure", "denied"],
    }).notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    metadata: jsonb("metadata"),
  },
  (table) => [
    index("idx_app_audit_events_occurred_at_id").on(table.occurredAt, table.id),
    index("idx_app_audit_events_actor_id_occurred_at").on(
      table.actorId,
      table.occurredAt,
    ),
    index("idx_app_audit_events_resource_type_resource_id_occurred_at").on(
      table.resourceType,
      table.resourceId,
      table.occurredAt,
    ),
  ],
);

export type AppAuditEvent = typeof appAuditEvents.$inferSelect;
export type NewAppAuditEvent = typeof appAuditEvents.$inferInsert;
