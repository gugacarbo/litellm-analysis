import { afterEach, describe, expect, it, vi } from "vitest";

const consoleMethods = ["debug", "info", "warn", "error"] as const;

async function loadLogger(colorLevel?: 0 | 1 | 2 | 3) {
  vi.resetModules();
  if (colorLevel !== undefined) {
    vi.doMock("chalk", async () => {
      const actual = await vi.importActual<typeof import("chalk")>("chalk");
      return {
        ...actual,
        Chalk: class extends actual.Chalk {
          constructor() {
            super({ level: colorLevel });
          }
        },
      };
    });
  }
  return import("./index");
}

describe("@lite-llm/logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("emits consumer, ISO timestamp, event, and metadata as JSON", async () => {
    vi.stubEnv("LOGGER_FORMAT", "json");
    const { createLogger } = await loadLogger();
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const logger = createLogger({ consumer: "ui" });

    logger.info("runtime_status_success", {
      requestId: "req_123",
      durationMs: 42,
    });

    expect(info).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(info.mock.calls[0][0] as string) as Record<
      string,
      unknown
    >;
    expect(entry).toMatchObject({
      level: "info",
      event: "runtime_status_success",
      consumer: "ui",
      requestId: "req_123",
      durationMs: 42,
    });
    expect(entry.timestamp).toEqual(expect.any(String));
    expect(new Date(entry.timestamp as string).toISOString()).toBe(
      entry.timestamp,
    );
  });

  it("uses the matching console destination for every level", async () => {
    vi.stubEnv("LOGGER_FORMAT", "json");
    const { createLogger } = await loadLogger();
    const spies = Object.fromEntries(
      consoleMethods.map((method) => [
        method,
        vi.spyOn(console, method).mockImplementation(() => undefined),
      ]),
    ) as Record<(typeof consoleMethods)[number], ReturnType<typeof vi.spyOn>>;
    const logger = createLogger({ consumer: "tests" });

    logger.debug("debug_event");
    logger.info("info_event");
    logger.warn("warn_event");
    logger.error("error_event");

    for (const method of consoleMethods) {
      expect(spies[method]).toHaveBeenCalledTimes(1);
      expect(JSON.parse(spies[method].mock.calls[0][0] as string).level).toBe(
        method,
      );
    }
  });

  it.each([
    undefined,
    "xml",
    "JSON",
  ])("falls back to JSON for LOGGER_FORMAT=%s", async (format) => {
    if (format === undefined) {
      vi.stubEnv("LOGGER_FORMAT", "");
    } else {
      vi.stubEnv("LOGGER_FORMAT", format);
    }
    const { createLogger } = await loadLogger();
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    createLogger({ consumer: "tests" }).info("fallback");

    expect(() => JSON.parse(info.mock.calls[0][0] as string)).not.toThrow();
  });

  it.each([
    ["debug", "34", "debug"],
    ["info", "32", "info"],
    ["warn", "33", "warn"],
    ["error", "31", "error"],
  ] as const)("maps %s to its deterministic Chalk color", async (level, code, method) => {
    vi.stubEnv("LOGGER_FORMAT", "pretty");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-02T03:04:05.678Z"));
    const { createLogger } = await loadLogger(1);
    const outputSpy = vi
      .spyOn(console, method)
      .mockImplementation(() => undefined);

    createLogger({ consumer: "ui" })[level]("runtime_status_success", {
      requestId: "req_123",
      durationMs: 42,
    });

    const output = outputSpy.mock.calls[0][0] as string;
    expect(output).toBe(
      `\u001b[90m2026-01-02T03:04:05.678Z\u001b[39m  \u001b[${code}m${level.toUpperCase().padEnd(5)}\u001b[39m  \u001b[36m[ui]\u001b[39m  \u001b[1mruntime_status_success\u001b[22m  requestId=req_123 durationMs=42`,
    );
    expect(output).not.toContain("\n");
  });

  it("does not emit ANSI when Chalk color support is disabled", async () => {
    vi.stubEnv("LOGGER_FORMAT", "pretty");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-02T03:04:05.678Z"));
    const { createLogger } = await loadLogger(0);
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    createLogger({ consumer: "ui" }).info("runtime_status_success", {
      requestId: "req_123",
      durationMs: 42,
    });

    expect(info.mock.calls[0][0]).toBe(
      "2026-01-02T03:04:05.678Z  INFO   [ui]  runtime_status_success  requestId=req_123 durationMs=42",
    );
    expect(info.mock.calls[0][0]).not.toContain("\u001b[");
  });
});
