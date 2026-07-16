import { describe, expect, it } from "vitest";
import type { AuditEventsRepositoryPort } from "../../repositories/audit-events-repository.js";
import {
  AuditEventError,
  type AuditEventRecord,
  type SanitizedAuditEventInsert,
} from "../../types/audit-events.js";
import { AuditEventsService } from "../audit-events.service.js";

const ids = {
  newest: "00000000-0000-4000-8000-000000000003",
  middle: "00000000-0000-4000-8000-000000000002",
  oldest: "00000000-0000-4000-8000-000000000001",
};

function record(overrides: Partial<AuditEventRecord> = {}): AuditEventRecord {
  return {
    id: ids.middle,
    occurredAt: new Date("2026-07-16T12:00:00.000Z"),
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
    metadata: null,
    ...overrides,
  };
}

function repositoryDouble(): {
  repository: AuditEventsRepositoryPort;
  appended: SanitizedAuditEventInsert[];
  listInputs: unknown[];
} {
  const appended: SanitizedAuditEventInsert[] = [];
  const listInputs: unknown[] = [];
  return {
    appended,
    listInputs,
    repository: {
      async append(input) {
        appended.push(input);
        return record({ ...input, id: ids.middle, occurredAt: new Date() });
      },
      async list(input) {
        listInputs.push(input);
        return { records: [], hasNewer: false, hasOlder: false };
      },
      async getPublicById() {
        return null;
      },
    },
  };
}

function decodeCursor(value: string): { occurredAt: string; id: string } {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as {
    occurredAt: string;
    id: string;
  };
}

describe("AuditEventsService", () => {
  it("redacts snapshots before append and never exposes them in list DTOs", async () => {
    const { repository, appended } = repositoryDouble();
    const service = new AuditEventsService({ repository });
    const list = await service.append({
      actorType: "user",
      actorId: "actor-1",
      actorRole: "admin",
      source: "ui",
      requestId: "request-1",
      action: "model.update",
      resourceType: "model",
      outcome: "success",
      metadata: {
        authorization: "Bearer audit-token-should-not-persist",
        nested: { fingerprint: "audit-fingerprint-should-not-persist" },
      },
    });

    expect(appended[0]?.metadata).toEqual({
      authorization: "[REDACTED]",
      nested: { fingerprint: "[REDACTED]" },
    });
    expect(JSON.stringify(appended)).not.toContain(
      "audit-token-should-not-persist",
    );
    expect(JSON.stringify(appended)).not.toContain(
      "audit-fingerprint-should-not-persist",
    );
    expect(list).not.toHaveProperty("metadata");
    expect(list).not.toHaveProperty("before");
    expect(list).not.toHaveProperty("after");
  });

  it("rejects invalid snapshot before it can reach the repository or error DTO", async () => {
    const { repository, appended } = repositoryDouble();
    const service = new AuditEventsService({ repository });
    await expect(
      service.append({
        actorType: "user",
        source: "ui",
        requestId: "request-1",
        action: "model.update",
        resourceType: "model",
        outcome: "success",
        metadata: new Error("audit-secret-should-not-persist"),
      }),
    ).rejects.toMatchObject({
      code: "VALIDATION",
      message: "Invalid audit event input",
    });
    expect(appended).toEqual([]);
  });

  it("validates filters and cursor before calling the repository", async () => {
    const { repository, listInputs } = repositoryDouble();
    const service = new AuditEventsService({ repository });
    await expect(
      service.list({
        actorId: "",
        cursor: "audit-secret-should-not-persist",
        direction: "older",
      }),
    ).rejects.toBeInstanceOf(AuditEventError);
    await expect(
      service.list({ cursor: "audit-secret-should-not-persist" }),
    ).rejects.toBeInstanceOf(AuditEventError);
    for (const input of [
      { start: "2026-02-31T00:00:00.000Z" },
      { end: "2026-02-31T00:00:00.000Z" },
      {
        cursor: Buffer.from(
          JSON.stringify({
            v: 1,
            occurredAt: "2026-02-31T00:00:00.000Z",
            id: ids.middle,
          }),
        ).toString("base64url"),
        direction: "older" as const,
      },
    ]) {
      await expect(service.list(input)).rejects.toMatchObject({
        code: "VALIDATION",
        message: "Invalid audit event input",
      });
    }
    expect(listInputs).toEqual([]);
    await service.list({
      start: "2026-07-16T00:00:00.000Z",
      end: "2026-07-16T23:59:59.999Z",
      actorId: "actor-1",
      action: "model.update",
      resourceType: "model",
      outcome: "success",
      pageSize: 100,
    });
    expect(listInputs[0]).toMatchObject({ pageSize: 100, actorId: "actor-1" });
  });

  it("maps bidirectional cursor pages without duplicate or lost equal timestamps", async () => {
    const newest = record({
      id: ids.newest,
      occurredAt: new Date("2026-07-16T12:00:00.000Z"),
    });
    const middle = record({
      id: ids.middle,
      occurredAt: new Date("2026-07-16T12:00:00.000Z"),
    });
    const oldest = record({
      id: ids.oldest,
      occurredAt: new Date("2026-07-16T11:59:00.000Z"),
    });
    const responses = [
      { records: [newest, middle], hasNewer: false, hasOlder: true },
      { records: [oldest], hasNewer: true, hasOlder: false },
      { records: [newest, middle], hasNewer: false, hasOlder: true },
    ];
    const repository: AuditEventsRepositoryPort = {
      async append() {
        return middle;
      },
      async list() {
        const response = responses.shift();
        if (!response) throw new Error("unexpected repository call");
        return response;
      },
      async getPublicById() {
        return null;
      },
    };
    const service = new AuditEventsService({ repository });
    const initial = await service.list({ pageSize: 2 });
    expect(initial.events.map((item) => item.id)).toEqual([
      ids.newest,
      ids.middle,
    ]);
    expect(initial.newerCursor).toBeNull();
    expect(decodeCursor(initial.olderCursor ?? "").id).toBe(ids.middle);

    const older = await service.list({
      cursor: initial.olderCursor ?? "",
      direction: "older",
      pageSize: 2,
    });
    expect(older.events.map((item) => item.id)).toEqual([ids.oldest]);
    expect(older.olderCursor).toBeNull();
    expect(decodeCursor(older.newerCursor ?? "").id).toBe(ids.oldest);

    const newer = await service.list({
      cursor: older.newerCursor ?? "",
      direction: "newer",
      pageSize: 2,
    });
    expect(newer.events.map((item) => item.id)).toEqual([
      ids.newest,
      ids.middle,
    ]);
  });

  it("redacts detail snapshots sourced from persistence and returns only stable errors", async () => {
    const repository: AuditEventsRepositoryPort = {
      async append() {
        return record();
      },
      async list() {
        return { records: [], hasNewer: false, hasOlder: false };
      },
      async getPublicById(id) {
        return id === ids.middle
          ? record({ metadata: { cookie: "audit-cookie-should-not-persist" } })
          : null;
      },
    };
    const service = new AuditEventsService({ repository });
    await expect(service.getPublicById(ids.middle)).resolves.toMatchObject({
      metadata: { cookie: "[REDACTED]" },
    });
    await expect(service.getPublicById(ids.newest)).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Audit event not found",
    });
  });
});
