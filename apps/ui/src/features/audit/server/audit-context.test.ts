import { describe, expect, it, vi } from "vitest";
import { createAuditContext } from "./audit-context";

const adminSession = {
  ok: true as const,
  session: {
    user: { id: "admin-1", role: "admin" },
    session: { id: "session-should-not-leak" },
  },
};

describe("createAuditContext", () => {
  it("uses the Web Crypto default with its receiver preserved", async () => {
    const result = await createAuditContext({
      getSession: vi.fn().mockResolvedValue(adminSession),
      requireAdmin: vi.fn().mockResolvedValue({ ok: true }),
    });

    expect(result).toMatchObject({ ok: true });
  });

  it("builds trusted UI provenance only after session and role checks", async () => {
    const requireAdmin = vi.fn().mockResolvedValue({ ok: true });
    const result = await createAuditContext({
      getSession: vi.fn().mockResolvedValue(adminSession),
      requireAdmin,
      createRequestId: () => "request-1",
    });

    expect(requireAdmin).toHaveBeenCalledWith(adminSession.session);
    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.context).toEqual({});
      expect(Object.isFrozen(result.context)).toBe(true);
      expect(Object.keys(result.context)).toEqual([]);
    }
    expect(JSON.stringify(result)).not.toContain("session-should-not-leak");
  });

  it("returns stable unauthenticated and forbidden results without request provenance", async () => {
    const unauthenticated = await createAuditContext({
      getSession: vi.fn().mockResolvedValue({
        ok: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "cookie audit-cookie-should-not-persist",
        },
      }),
      requireAdmin: vi.fn(),
    });
    const forbidden = await createAuditContext({
      getSession: vi.fn().mockResolvedValue(adminSession),
      requireAdmin: vi.fn().mockResolvedValue({
        ok: false,
        error: { code: "FORBIDDEN", message: "viewer" },
      }),
    });

    expect(unauthenticated).toEqual({
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "Authentication required" },
    });
    expect(forbidden).toEqual({
      ok: false,
      error: { code: "FORBIDDEN", message: "Administrator role required" },
    });
  });
});
