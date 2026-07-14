import { afterEach, describe, expect, it, vi } from "vitest";
import { createLogger } from "./index";

const consoleMethods = ["debug", "info", "warn", "error"] as const;

describe("@lite-llm/logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("emits consumer, ISO timestamp, event, and metadata as JSON", () => {
    vi.stubEnv("LOGGER_FORMAT", "json");
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

  it("uses the matching console destination for every level", () => {
    vi.stubEnv("LOGGER_FORMAT", "json");
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
  ])("falls back to JSON for LOGGER_FORMAT=%s", (format) => {
    if (format === undefined) {
      vi.stubEnv("LOGGER_FORMAT", "");
    } else {
      vi.stubEnv("LOGGER_FORMAT", format);
    }
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    createLogger({ consumer: "tests" }).info("fallback");

    expect(() => JSON.parse(info.mock.calls[0][0] as string)).not.toThrow();
  });

  it("renders pretty output as one line with the event and metadata", () => {
    vi.stubEnv("LOGGER_FORMAT", "pretty");
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    createLogger({ consumer: "ui" }).info("runtime_status_success", {
      requestId: "req_123",
      durationMs: 42,
    });

    const output = info.mock.calls[0][0] as string;
    expect(output).toContain("INFO");
    expect(output).toContain("[ui]");
    expect(output).toContain("runtime_status_success");
    expect(output).toContain("requestId=req_123");
    expect(output).toContain("durationMs=42");
    expect(output).not.toContain("\n");
  });
});
