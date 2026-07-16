import { appAuditEvents } from "@lite-llm/database/schema";
import { describe, expect, it } from "vitest";
import {
  createSanitizedAuditEventInsert,
  type SanitizedAuditEventInsert,
} from "../types/audit-events.js";
import { AuditEventsRepository } from "./audit-events-repository.js";

const records = [
  {
    id: "00000000-0000-4000-8000-000000000003",
    occurredAt: new Date("2026-07-16T12:00:00.000Z"),
    actorType: "user" as const,
    actorId: "actor-1",
    actorRole: "admin" as const,
    source: "ui" as const,
    requestId: "request-1",
    action: "model.update",
    resourceType: "model",
    resourceId: "model-1",
    outcome: "success" as const,
    before: null,
    after: null,
    metadata: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    occurredAt: new Date("2026-07-16T11:59:00.000Z"),
    actorType: "user" as const,
    actorId: "actor-1",
    actorRole: "admin" as const,
    source: "ui" as const,
    requestId: "request-2",
    action: "model.update",
    resourceType: "model",
    resourceId: "model-1",
    outcome: "success" as const,
    before: null,
    after: null,
    metadata: null,
  },
];

describe("AuditEventsRepository", () => {
  it("rejects a direct raw snapshot before insert and preserves the type boundary", async () => {
    let inserted = false;
    const db = {
      insert() {
        inserted = true;
        throw new Error("audit-secret-should-not-persist");
      },
    };
    const repository = new AuditEventsRepository(db as never);
    const rawInsert = {
      actorType: "user" as const,
      actorId: "actor-1",
      actorRole: "admin" as const,
      source: "ui" as const,
      requestId: "request-1",
      action: "model.update",
      resourceType: "model",
      resourceId: "model-1",
      outcome: "success" as const,
      before: null,
      after: null,
      metadata: new Date(),
    };
    // @ts-expect-error Date is not a sanitized AuditJson snapshot.
    await expect(repository.append(rawInsert)).rejects.toMatchObject({
      code: "VALIDATION",
      message: "Invalid audit event input",
    });
    await expect(
      repository.append({
        ...rawInsert,
        metadata: { authorization: "Bearer audit-token-should-not-persist" },
      } as SanitizedAuditEventInsert),
    ).rejects.toMatchObject({
      code: "VALIDATION",
      message: "Invalid audit event input",
    });
    expect(inserted).toBe(false);
    expect(
      (rawInsert as unknown as SanitizedAuditEventInsert).metadata,
    ).toBeInstanceOf(Date);
  });

  it("rejects raw snapshots through the exported constructor before the DB double", async () => {
    let inserted = false;
    const repository = new AuditEventsRepository({
      insert() {
        inserted = true;
        throw new Error("audit-secret-should-not-persist");
      },
    } as never);
    const candidate = {
      actorType: "user" as const,
      actorId: "actor-1",
      actorRole: "admin" as const,
      source: "ui" as const,
      requestId: "request-1",
      action: "model.update",
      resourceType: "model",
      resourceId: "model-1",
      outcome: "success" as const,
      before: null,
      after: null,
      metadata: new Date(),
    };
    await expect(
      (async () =>
        repository.append(createSanitizedAuditEventInsert(candidate)))(),
    ).rejects.toMatchObject({
      code: "VALIDATION",
      message: "Invalid audit event input",
    });
    expect(inserted).toBe(false);
  });

  it("revalidates a mutated branded insert before it can reach the DB", async () => {
    let inserted = false;
    const repository = new AuditEventsRepository({
      insert() {
        inserted = true;
        throw new Error("audit-secret-should-not-persist");
      },
    } as never);
    const sanitized = createSanitizedAuditEventInsert({
      actorType: "user",
      actorId: "actor-1",
      actorRole: "admin",
      source: "ui",
      requestId: "request-1",
      action: "model.update",
      resourceType: "model",
      resourceId: "model-1",
      outcome: "success",
      before: null,
      after: null,
      metadata: { safe: "value" },
    });
    (sanitized.metadata as Record<string, unknown>).safe = new Date();

    await expect(repository.append(sanitized)).rejects.toMatchObject({
      code: "VALIDATION",
      message: "Invalid audit event input",
    });
    expect(inserted).toBe(false);
  });

  it("uses pageSize plus one and probes both directions under the same filters", async () => {
    const limits: number[] = [];
    let selectCalls = 0;
    const db = {
      select() {
        selectCalls += 1;
        return {
          from(table: unknown) {
            expect(table).toBe(appAuditEvents);
            return {
              where() {
                return {
                  orderBy() {
                    return {
                      limit(limit: number) {
                        limits.push(limit);
                        return Promise.resolve(records);
                      },
                    };
                  },
                  limit(limit: number) {
                    limits.push(limit);
                    return Promise.resolve([{ id: "probe" }]);
                  },
                };
              },
            };
          },
        };
      },
    };
    const repository = new AuditEventsRepository(db as never);
    const result = await repository.list({
      actorId: "actor-1",
      action: "model.update",
      resourceType: "model",
      outcome: "success",
      pageSize: 1,
    });

    expect(result.records).toEqual([records[0]]);
    expect(result.hasNewer).toBe(true);
    expect(result.hasOlder).toBe(true);
    expect(selectCalls).toBe(3);
    expect(limits).toEqual([2, 1, 1]);
  });

  it("reverses the internally ascending newer selection before returning it", async () => {
    const db = {
      select() {
        return {
          from() {
            return {
              where() {
                return {
                  orderBy() {
                    return {
                      limit() {
                        return Promise.resolve([...records].reverse());
                      },
                    };
                  },
                  limit() {
                    return Promise.resolve([]);
                  },
                };
              },
            };
          },
        };
      },
    };
    const repository = new AuditEventsRepository(db as never);
    const result = await repository.list({
      cursor: {
        v: 1,
        occurredAt: "2026-07-16T11:58:00.000Z",
        id: "00000000-0000-4000-8000-000000000001",
      },
      direction: "newer",
      pageSize: 2,
    });

    expect(result.records.map((record) => record.id)).toEqual([
      "00000000-0000-4000-8000-000000000003",
      "00000000-0000-4000-8000-000000000002",
    ]);
  });
});
