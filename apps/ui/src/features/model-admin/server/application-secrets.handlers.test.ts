import { describe, expect, it, vi } from "vitest";
import {
  type ApplicationSecretsHandlerDeps,
  handleListApplicationSecrets,
  handleRemoveApplicationSecret,
  handleReplaceApplicationSecret,
} from "./application-secrets.handlers";

const configuredAt = new Date("2026-07-14T00:00:00.000Z");

function createDeps(overrides: Partial<ApplicationSecretsHandlerDeps> = {}) {
  const service = {
    list: vi.fn().mockResolvedValue([
      {
        key: "artificial_analysis_api_key",
        isConfigured: true,
        createdAt: configuredAt,
        updatedAt: configuredAt,
      },
      {
        key: "openrouter_api_key",
        isConfigured: false,
        createdAt: null,
        updatedAt: null,
      },
    ]),
    replace: vi.fn().mockResolvedValue({
      key: "artificial_analysis_api_key",
      isConfigured: true,
      createdAt: configuredAt,
      updatedAt: configuredAt,
    }),
    remove: vi.fn().mockResolvedValue({
      key: "artificial_analysis_api_key",
      isConfigured: false,
      createdAt: null,
      updatedAt: null,
    }),
  };
  return {
    service,
    deps: {
      getSession: vi.fn().mockResolvedValue({
        ok: true,
        session: {
          user: { id: "admin-1", role: "admin" },
          session: { id: "session-1" },
        },
      }),
      requireAdmin: vi.fn().mockResolvedValue({ ok: true }),
      getService: vi.fn().mockResolvedValue(service),
      ...overrides,
    } satisfies ApplicationSecretsHandlerDeps,
  };
}

describe("application secrets handlers", () => {
  it("rejects an unauthenticated status request before resolving the service", async () => {
    const { deps } = createDeps({
      getSession: vi.fn().mockResolvedValue({
        ok: false,
        error: { code: "UNAUTHENTICATED", message: "No valid session found" },
      }),
    });

    await expect(handleListApplicationSecrets(deps)).resolves.toEqual({
      ok: false,
      error: {
        code: "UNAUTHENTICATED",
        message: "No valid session found",
        retryable: false,
      },
    });
    expect(deps.getService).not.toHaveBeenCalled();
  });

  it("rejects a viewer status request before resolving the service", async () => {
    const { deps } = createDeps({
      getSession: vi.fn().mockResolvedValue({
        ok: true,
        session: {
          user: { id: "viewer-1", role: "viewer" },
          session: { id: "session-1" },
        },
      }),
      requireAdmin: vi.fn().mockResolvedValue({
        ok: false,
        error: { code: "FORBIDDEN", message: "Role 'admin' required" },
      }),
    });

    await expect(handleListApplicationSecrets(deps)).resolves.toEqual({
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "Role 'admin' required",
        retryable: false,
      },
    });
    expect(deps.getService).not.toHaveBeenCalled();
  });

  it("lets an admin list metadata only", async () => {
    const { deps } = createDeps();

    const result = await handleListApplicationSecrets(deps);

    expect(result).toMatchObject({ ok: true });
    expect(JSON.stringify(result)).not.toContain("credentialEnvelope");
    expect(JSON.stringify(result)).not.toContain("plaintext");
    expect(JSON.stringify(result)).not.toContain("ciphertext");
  });

  it("lets an admin replace and remove an allowlisted secret", async () => {
    const { deps, service } = createDeps();

    await expect(
      handleReplaceApplicationSecret(deps, {
        key: "artificial_analysis_api_key",
        value: "new-private-value",
      }),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      handleRemoveApplicationSecret(deps, {
        key: "artificial_analysis_api_key",
      }),
    ).resolves.toMatchObject({ ok: true });

    expect(service.replace).toHaveBeenCalledWith(
      "artificial_analysis_api_key",
      "new-private-value",
    );
    expect(service.remove).toHaveBeenCalledWith("artificial_analysis_api_key");
  });

  it("rejects unsupported keys and blank values before resolving the service", async () => {
    const { deps } = createDeps();

    await expect(
      handleReplaceApplicationSecret(deps, {
        key: "other_key" as never,
        value: "   ",
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "VALIDATION", retryable: false },
    });
    expect(deps.getService).not.toHaveBeenCalled();
  });
});
