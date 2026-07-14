import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Auth } from "@/features/auth/server/auth";
import { createServerContext, type ServerLogger } from "@/server/context";

function mockAuth(): Auth {
  return {
    handler: vi.fn(),
    db: {} as unknown as Auth["db"],
    options: { secret: "test" },
  };
}

describe("createServerContext", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("wires the shared logger for the ui consumer with all levels", () => {
    const outputs = {
      debug: vi.spyOn(console, "debug").mockImplementation(() => undefined),
      info: vi.spyOn(console, "info").mockImplementation(() => undefined),
      warn: vi.spyOn(console, "warn").mockImplementation(() => undefined),
      error: vi.spyOn(console, "error").mockImplementation(() => undefined),
    };
    const context = createServerContext({ auth: mockAuth() });
    const logger: ServerLogger = context.logger;

    logger.debug("debug_event", { requestId: "req-1" });
    logger.info("info_event");
    logger.warn("warn_event");
    logger.error("error_event");

    expect(Object.keys(logger)).toEqual(["debug", "info", "warn", "error"]);
    for (const [level, output] of Object.entries(outputs)) {
      expect(output).toHaveBeenCalledOnce();
      expect(JSON.parse(output.mock.calls[0]?.[0] ?? "{}")).toMatchObject({
        consumer: "ui",
        level,
      });
    }
  });
});
