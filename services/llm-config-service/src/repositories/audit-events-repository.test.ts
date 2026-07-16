import { appAuditEvents } from "@lite-llm/database/schema";
import { describe, expect, it } from "vitest";
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
