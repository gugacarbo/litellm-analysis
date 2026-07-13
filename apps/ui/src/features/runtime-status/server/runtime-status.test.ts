import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the auth module
vi.mock("../../auth/server/auth", () => ({
  getAuth: vi.fn(),
}));

vi.mock("../../auth/server/invites", () => ({
  requireSession: vi.fn(),
  requireRole: vi.fn(),
}));

import type { Auth } from "../../auth/server/auth";
import { requireRole, requireSession } from "../../auth/server/invites";
import { handleGetRuntimeStatus } from "./runtime-status.functions";

function mockAuth(): Auth {
  return {
    handler: vi.fn(),
    db: {} as unknown as Auth["db"],
    options: { secret: "test" },
  };
}

function mockRequest(): Request {
  return new Request("http://localhost/api/runtime-status");
}

describe("handleGetRuntimeStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns UNAUTHENTICATED when no valid session", async () => {
    vi.mocked(requireSession).mockResolvedValue({
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "No valid session" },
    });

    const result = await handleGetRuntimeStatus({
      auth: mockAuth(),
      request: mockRequest(),
    });

    expect(result).toEqual({
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "No valid session" },
    });
  });

  it("returns FORBIDDEN when user is not admin", async () => {
    vi.mocked(requireSession).mockResolvedValue({
      ok: true,
      session: {
        user: { id: "user-1", role: "viewer" },
        session: { id: "sess-1" },
      },
    });
    vi.mocked(requireRole).mockResolvedValue({
      ok: false,
      error: { code: "FORBIDDEN", message: "Role 'admin' required" },
    });

    const result = await handleGetRuntimeStatus({
      auth: mockAuth(),
      request: mockRequest(),
    });

    expect(result).toEqual({
      ok: false,
      error: { code: "FORBIDDEN", message: "Role 'admin' required" },
    });
  });

  it("returns success for admin user", async () => {
    vi.mocked(requireSession).mockResolvedValue({
      ok: true,
      session: {
        user: { id: "user-1", role: "admin" },
        session: { id: "sess-1" },
      },
    });
    vi.mocked(requireRole).mockResolvedValue({ ok: true });

    const result = await handleGetRuntimeStatus({
      auth: mockAuth(),
      request: mockRequest(),
    });

    expect(result).toEqual({
      ok: true,
      authenticated: true,
      runtime: "tanstack-start",
    });
  });

  it("returns INTERNAL on unexpected errors", async () => {
    vi.mocked(requireSession).mockRejectedValue(
      new Error("DB connection failed"),
    );

    const result = await handleGetRuntimeStatus({
      auth: mockAuth(),
      request: mockRequest(),
    });

    expect(result).toEqual({
      ok: false,
      error: { code: "INTERNAL", message: "Internal server error" },
    });
  });
});
