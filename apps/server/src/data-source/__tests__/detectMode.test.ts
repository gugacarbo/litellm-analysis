import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detectMode } from "../index";

describe("detectMode", () => {
  beforeEach(() => {
    vi.stubEnv("ACCESS_MODE", undefined);
    vi.stubEnv("DB_HOST", undefined);
    vi.stubEnv("LITELLM_API_URL", undefined);
    vi.stubEnv("LITELLM_API_KEY", undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 'database' when ACCESS_MODE=full", () => {
    vi.stubEnv("ACCESS_MODE", "full");
    expect(detectMode()).toBe("database");
  });

  it("returns 'api-only' when ACCESS_MODE=api-only", () => {
    vi.stubEnv("ACCESS_MODE", "api-only");
    expect(detectMode()).toBe("api-only");
  });

  it("returns 'database' when ACCESS_MODE=limited and DB_HOST is set", () => {
    vi.stubEnv("ACCESS_MODE", "limited");
    vi.stubEnv("DB_HOST", "localhost");
    expect(detectMode()).toBe("database");
  });

  it("returns 'api-only' and warns when ACCESS_MODE=limited without DB_HOST", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("ACCESS_MODE", "limited");
    expect(detectMode()).toBe("api-only");
    expect(warnSpy).toHaveBeenCalledWith(
      "[data-source] ACCESS_MODE=limited but DB_HOST is not set. Falling back to api-only mode.",
    );
    warnSpy.mockRestore();
  });

  it("returns 'database' when ACCESS_MODE is undefined and DB_HOST is set", () => {
    vi.stubEnv("DB_HOST", "localhost");
    expect(detectMode()).toBe("database");
  });

  it("returns 'api-only' when ACCESS_MODE is undefined, no DB_HOST, but LITELLM_API_URL and LITELLM_API_KEY are set", () => {
    vi.stubEnv("LITELLM_API_URL", "http://localhost:4000");
    vi.stubEnv("LITELLM_API_KEY", "sk-test");
    expect(detectMode()).toBe("api-only");
  });
});
