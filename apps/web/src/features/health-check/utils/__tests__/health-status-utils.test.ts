import { describe, expect, it } from "vitest";
import type { HealthCheckResultEntry } from "../../types/health-status-types";
import {
  isNewerHealthCheckEntry,
  mergeLatestHealthChecks,
} from "../health-status-utils";

function entry(
  overrides: Partial<HealthCheckResultEntry> & {
    modelName: string;
    checkedAt: number;
  },
): HealthCheckResultEntry {
  return {
    id: 0,
    status: "healthy",
    responseTimeMs: 100,
    ttftMs: 50,
    outputTokens: 10,
    tokensPerSecond: 5,
    statusCode: 200,
    promptSent: "ping",
    responseReceived: "pong",
    requestPayload: null,
    responsePayload: null,
    errorMessage: null,
    source: "manual",
    ...overrides,
  };
}

describe("isNewerHealthCheckEntry", () => {
  it("prefers a newer checkedAt timestamp", () => {
    const older = entry({ modelName: "gpt-4", checkedAt: 100, id: 5 });
    const newer = entry({ modelName: "gpt-4", checkedAt: 200, id: 0 });

    expect(isNewerHealthCheckEntry(newer, older)).toBe(true);
    expect(isNewerHealthCheckEntry(older, newer)).toBe(false);
  });

  it("breaks ties with the persisted database id", () => {
    const wsResult = entry({ modelName: "gpt-4", checkedAt: 100, id: 0 });
    const apiResult = entry({ modelName: "gpt-4", checkedAt: 100, id: 12 });

    expect(isNewerHealthCheckEntry(apiResult, wsResult)).toBe(true);
    expect(isNewerHealthCheckEntry(wsResult, apiResult)).toBe(false);
  });
});

describe("mergeLatestHealthChecks", () => {
  it("keeps the newest result per model across api and websocket sources", () => {
    const merged = mergeLatestHealthChecks(
      [entry({ modelName: "gpt-4", checkedAt: 100, id: 5, status: "healthy" })],
      [
        entry({
          modelName: "gpt-4",
          checkedAt: 200,
          id: 0,
          status: "unhealthy",
        }),
        entry({
          modelName: "claude-3",
          checkedAt: 150,
          id: 0,
          status: "error",
        }),
      ],
    );

    expect(merged.get("gpt-4")?.status).toBe("unhealthy");
    expect(merged.get("claude-3")?.status).toBe("error");
  });
});
