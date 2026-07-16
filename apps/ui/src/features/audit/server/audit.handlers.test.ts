import { describe, expect, it, vi } from "vitest";
import {
  type AuditHandlerDeps,
  handleGetAuditEvent,
  handleListAuditEvents,
} from "./audit.handlers";

const eventId = "11111111-1111-4111-8111-111111111111";

function createDeps(overrides: Partial<AuditHandlerDeps> = {}) {
  const service = {
    list: vi.fn().mockResolvedValue({
      events: [
        {
          id: eventId,
          occurredAt: new Date("2026-07-16T00:00:00.000Z"),
          actorType: "user",
          actorId: "admin-1",
          actorRole: "admin",
          source: "ui",
          requestId: "request-1",
          action: "model.updated",
          resourceType: "model",
          resourceId: "model-1",
          outcome: "success",
        },
      ],
      olderCursor: null,
      newerCursor: null,
    }),
    getPublicById: vi.fn(),
  };
  return {
    service,
    deps: {
      getAuditContext: vi.fn().mockResolvedValue({
        ok: true,
        context: {
          actorType: "user",
          actorId: "admin-1",
          actorRole: "admin",
          source: "ui",
          requestId: "request-1",
        },
      }),
      getService: vi.fn().mockResolvedValue(service),
      ...overrides,
    } satisfies AuditHandlerDeps,
  };
}

describe("audit handlers", () => {
  it("denies unauthenticated and viewer requests before resolving the service", async () => {
    const unauthenticated = createDeps({
      getAuditContext: vi.fn().mockResolvedValue({
        ok: false,
        error: { code: "UNAUTHENTICATED", message: "Authentication required" },
      }),
    });
    const viewer = createDeps({
      getAuditContext: vi.fn().mockResolvedValue({
        ok: false,
        error: { code: "FORBIDDEN", message: "Administrator role required" },
      }),
    });

    await expect(
      handleListAuditEvents(unauthenticated.deps, { pageSize: 50 }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "UNAUTHENTICATED" },
    });
    await expect(
      handleListAuditEvents(viewer.deps, { pageSize: 50 }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "FORBIDDEN" },
    });
    expect(unauthenticated.deps.getService).not.toHaveBeenCalled();
    expect(viewer.deps.getService).not.toHaveBeenCalled();
  });

  it("forwards only public filter input and never permits forged provenance", async () => {
    const { deps, service } = createDeps();
    const input = { action: "model.updated", pageSize: 50 };

    await handleListAuditEvents(deps, input);

    expect(service.list).toHaveBeenCalledWith(input);
    expect(JSON.stringify(service.list.mock.calls)).not.toContain("actorType");
    expect(JSON.stringify(service.list.mock.calls)).not.toContain("requestId");
  });

  it("keeps snapshots and sensitive sentinels out of list results and errors", async () => {
    const { deps, service } = createDeps();
    service.getPublicById.mockRejectedValue(
      new Error(
        "Authorization Bearer audit-token-should-not-persist session-should-not-persist ada@example.test 127.0.0.1 user-agent x-api-key audit-header-should-not-persist",
      ),
    );

    const list = await handleListAuditEvents(deps, { pageSize: 50 });
    const detailError = await handleGetAuditEvent(deps, { id: eventId });
    const serialized = JSON.stringify({ list, detailError });

    expect(serialized).not.toContain("before");
    expect(serialized).not.toContain("after");
    expect(serialized).not.toContain("metadata");
    expect(serialized).not.toContain("Authorization");
    expect(serialized).not.toContain("audit-token-should-not-persist");
    expect(serialized).not.toContain("session-should-not-persist");
    expect(serialized).not.toContain("ada@example.test");
    expect(serialized).not.toContain("127.0.0.1");
    expect(serialized).not.toContain("user-agent");
    expect(serialized).not.toContain("audit-header-should-not-persist");
    expect(detailError).toEqual({
      ok: false,
      error: {
        code: "INTERNAL",
        message: "Internal server error",
        retryable: false,
      },
    });
  });
});
