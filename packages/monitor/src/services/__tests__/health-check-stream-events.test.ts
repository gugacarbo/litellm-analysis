import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HealthCheckService } from "../health-check-service";
import type { HealthCheckServiceOptions } from "../monitor-types";

vi.mock("../../db/monitor-queries", () => ({
  insertHealthCheck: vi.fn(),
  cleanupOldHealthChecks: vi.fn(),
}));

function createStreamingResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

function createServiceOptions(): HealthCheckServiceOptions {
  return {
    pollIntervalMs: 60_000,
    timeoutMs: 30_000,
    prompt: "Respond with ONLY your model name.",
    maxConcurrency: 1,
    modelProxyBaseUrl: "http://localhost:4000",
    modelProxyApiKey: "test-key",
    analyticsDataSource: {
      getModels: vi.fn().mockResolvedValue([]),
    } as unknown as HealthCheckServiceOptions["analyticsDataSource"],
    monitorDb: {} as HealthCheckServiceOptions["monitorDb"],
  };
}

describe("HealthCheckService stream events", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          createStreamingResponse([
            'data: {"choices":[{"delta":{"content":"gpt"}}]}\n\n',
            'data: {"choices":[{"delta":{"content":"-4o"}}]}\n\n',
            "data: [DONE]\n\n",
          ]),
        ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("emits started, deltas, and completed in order", async () => {
    const service = new HealthCheckService(createServiceOptions());
    const events: Array<{ type: string; data: unknown }> = [];

    service.on("health_check_stream_started", (data) => {
      events.push({ type: "health_check_stream_started", data });
    });
    service.on("health_check_stream_delta", (data) => {
      events.push({ type: "health_check_stream_delta", data });
    });
    service.on("health_check_stream_completed", (data) => {
      events.push({ type: "health_check_stream_completed", data });
    });
    service.on("health_check_stream_failed", (data) => {
      events.push({ type: "health_check_stream_failed", data });
    });

    const result = await service.runCheck("gpt-4o", "manual");

    expect(events.map((event) => event.type)).toEqual([
      "health_check_stream_started",
      "health_check_stream_delta",
      "health_check_stream_delta",
      "health_check_stream_completed",
    ]);

    const started = events[0]?.data as {
      executionId: string;
      modelName: string;
      prompt: string;
    };
    const executionId = started.executionId;

    expect(started.modelName).toBe("gpt-4o");
    expect(started.prompt).toBe("Respond with ONLY your model name.");
    expect(executionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    const deltas = events
      .filter((event) => event.type === "health_check_stream_delta")
      .map((event) => (event.data as { delta: string }).delta);
    expect(deltas).toEqual(["gpt", "-4o"]);

    for (const event of events) {
      if (event.type === "health_check_stream_delta") {
        expect((event.data as { executionId: string }).executionId).toBe(
          executionId,
        );
      }
    }

    const completed = events.at(-1)?.data as {
      executionId: string;
      result: { status: string; responseReceived: string | null };
    };
    expect(completed.executionId).toBe(executionId);
    expect(completed.result.status).toBe("healthy");
    expect(completed.result.responseReceived).toBe("gpt-4o");
    expect(result.status).toBe("healthy");
  });

  it("emits reasoning_content deltas", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          createStreamingResponse([
            'data: {"choices":[{"delta":{"reasoning_content":"think"}}]}\n\n',
            'data: {"choices":[{"delta":{"content":"answer"}}]}\n\n',
            "data: [DONE]\n\n",
          ]),
        ),
    );

    const service = new HealthCheckService(createServiceOptions());
    const deltas: string[] = [];

    service.on("health_check_stream_delta", (data) => {
      deltas.push(data.delta);
    });

    await service.runCheck("reasoning-model", "manual");

    expect(deltas).toEqual(["think", "answer"]);
  });

  it("emits failed when fetch throws after started", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    const service = new HealthCheckService(createServiceOptions());
    const events: string[] = [];

    service.on("health_check_stream_started", () => {
      events.push("health_check_stream_started");
    });
    service.on("health_check_stream_failed", () => {
      events.push("health_check_stream_failed");
    });

    const result = await service.runCheck("offline-model", "manual");

    expect(events).toEqual([
      "health_check_stream_started",
      "health_check_stream_failed",
    ]);
    expect(result.status).toBe("error");
  });
});
