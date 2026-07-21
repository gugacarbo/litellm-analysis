import { describe, expect, it, vi } from "vitest";
import {
  handleGenerateCodingAgentArtifact,
  handleGetCodingAgentsOverview,
} from "./coding-agents.handlers";

const adminSession = {
  ok: true as const,
  session: {
    session: {} as never,
    user: { id: "admin", role: "admin" } as never,
  },
};

describe("coding agents handlers", () => {
  it("does not resolve the service before authentication", async () => {
    const getService = vi.fn();
    const result = await handleGetCodingAgentsOverview({
      getSession: vi.fn().mockResolvedValue({
        ok: false,
        error: { code: "UNAUTHENTICATED", message: "Authentication required" },
      }),
      requireAdmin: vi.fn(),
      getService,
    });
    expect(result).toMatchObject({
      ok: false,
      error: { code: "UNAUTHENTICATED" },
    });
    expect(getService).not.toHaveBeenCalled();
  });

  it("does not expose artifacts to viewers", async () => {
    const getService = vi.fn();
    const result = await handleGenerateCodingAgentArtifact(
      {
        getSession: vi.fn().mockResolvedValue(adminSession),
        requireAdmin: vi.fn().mockResolvedValue({
          ok: false,
          error: { code: "FORBIDDEN", message: "Administrator role required" },
        }),
        getService,
      },
      "hebo",
    );
    expect(result).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(getService).not.toHaveBeenCalled();
  });

  it("returns generated environment references for admins", async () => {
    const result = await handleGenerateCodingAgentArtifact(
      {
        getSession: vi.fn().mockResolvedValue(adminSession),
        requireAdmin: vi
          .fn()
          .mockResolvedValue({ ok: true, session: adminSession.session }),
        getService: vi.fn().mockResolvedValue({
          generateArtifact: vi.fn().mockResolvedValue({
            fileName: "work.opencode.json",
            content: '{"apiKey":"{env:MODEL_PROXY_API_KEY}"}\n',
            mediaType: "application/json",
            modelCount: 1,
            warnings: [],
          }),
        }),
      },
      "hebo",
    );
    expect(result).toMatchObject({
      ok: true,
      data: { content: expect.stringContaining("MODEL_PROXY_API_KEY") },
    });
  });
});
