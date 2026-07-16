import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { appAuditEvents } from "./audit-events";

function findIndex(name: string) {
  return getTableConfig(appAuditEvents).indexes.find(
    (index) => index.config.name === name,
  );
}

describe("app audit events schema", () => {
  it("defines the immutable audit-event contract without relationship data", () => {
    const table = getTableConfig(appAuditEvents);

    expect(table.name).toBe("app_audit_events");
    expect(table.columns.map((column) => column.name)).toEqual([
      "id",
      "occurred_at",
      "actor_type",
      "actor_id",
      "actor_role",
      "source",
      "request_id",
      "action",
      "resource_type",
      "resource_id",
      "outcome",
      "before",
      "after",
      "metadata",
    ]);
    expect(table.foreignKeys).toEqual([]);

    expect(appAuditEvents.id.notNull).toBe(true);
    expect(appAuditEvents.id.primary).toBe(true);
    expect(appAuditEvents.id.default).toBeDefined();
    expect(appAuditEvents.occurredAt.notNull).toBe(true);
    expect(appAuditEvents.occurredAt.default).toBeDefined();
    expect(appAuditEvents.actorType.notNull).toBe(true);
    expect(appAuditEvents.actorId.notNull).toBe(false);
    expect(appAuditEvents.actorRole.notNull).toBe(false);
    expect(appAuditEvents.source.notNull).toBe(true);
    expect(appAuditEvents.requestId.notNull).toBe(true);
    expect(appAuditEvents.action.notNull).toBe(true);
    expect(appAuditEvents.resourceType.notNull).toBe(true);
    expect(appAuditEvents.resourceId.notNull).toBe(false);
    expect(appAuditEvents.outcome.notNull).toBe(true);
    expect(appAuditEvents.before.notNull).toBe(false);
    expect(appAuditEvents.after.notNull).toBe(false);
    expect(appAuditEvents.metadata.notNull).toBe(false);
  });

  it("persists actor, source, and outcome as PostgreSQL check domains", () => {
    const checkNames = getTableConfig(appAuditEvents).checks.map(
      (constraint) => constraint.name,
    );

    expect(appAuditEvents.actorType.enumValues).toEqual([
      "user",
      "api_key",
      "system",
    ]);
    expect(appAuditEvents.actorRole.enumValues).toEqual(["admin", "viewer"]);
    expect(appAuditEvents.source.enumValues).toEqual([
      "ui",
      "legacy_api",
      "proxy",
      "system",
    ]);
    expect(appAuditEvents.outcome.enumValues).toEqual([
      "success",
      "failure",
      "denied",
    ]);

    expect(checkNames).toEqual(
      expect.arrayContaining([
        "ck_app_audit_events_actor_type",
        "ck_app_audit_events_actor_role",
        "ck_app_audit_events_source",
        "ck_app_audit_events_outcome",
      ]),
    );
  });

  it("supports the audit list traversal indexes", () => {
    expect(
      findIndex("idx_app_audit_events_occurred_at_id")?.config.columns.map(
        (column) => (column as { name?: string }).name,
      ),
    ).toEqual(["occurred_at", "id"]);
    expect(
      findIndex(
        "idx_app_audit_events_actor_id_occurred_at",
      )?.config.columns.map((column) => (column as { name?: string }).name),
    ).toEqual(["actor_id", "occurred_at"]);
    expect(
      findIndex(
        "idx_app_audit_events_resource_type_resource_id_occurred_at",
      )?.config.columns.map((column) => (column as { name?: string }).name),
    ).toEqual(["resource_type", "resource_id", "occurred_at"]);
  });
});
