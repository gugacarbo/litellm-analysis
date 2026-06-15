import type { Server as HttpServer } from "node:http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppContext } from "../contexts";
import { createHealthCheckRuntime } from "../runtime/health-check-runtime";
import type { WebSocketServer } from "../ws/websocket-server";

vi.mock("../../../packages/monitor/src/db/monitor-queries", () => ({
  insertHealthCheck: vi.fn().mockReturnValue({ id: 1 }),
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

describe("health-check-runtime stream WS bridge", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          createStreamingResponse([
            'data: {"choices":[{"delta":{"content":"ok"}}]}\n\n',
            "data: [DONE]\n\n",
          ]),
        ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("broadcasts health_check_stream_* events over WebSocket", async () => {
    const broadcasts: Array<{ type: string; data: unknown }> = [];
    const wsServer = {
      broadcast: vi.fn((message: { type: string; data: unknown }) => {
        broadcasts.push(message);
      }),
      onClientMessage: vi.fn(),
      sendTo: vi.fn(),
    } satisfies Pick<
      WebSocketServer,
      "broadcast" | "onClientMessage" | "sendTo"
    >;

    const runtime = createHealthCheckRuntime({
      ctx: {
        analytics: {
          dataSource: {
            getModels: vi.fn().mockResolvedValue([]),
          },
        },
        monitor: {
          monitorDb: {},
        },
      } as unknown as AppContext,
      httpServer: {} as HttpServer,
      wsServer: wsServer as unknown as WebSocketServer,
      pollIntervalMs: 60_000,
      timeoutMs: 30_000,
      prompt: "test prompt",
      maxConcurrency: 1,
      litellmApiUrl: "http://localhost:4000",
      litellmApiKey: "test-key",
    });

    await runtime.healthCheckService.runCheck("test-model", "manual");

    const streamTypes = broadcasts
      .map((message) => message.type)
      .filter((type) => type.startsWith("health_check_stream_"));

    expect(streamTypes).toEqual([
      "health_check_stream_started",
      "health_check_stream_delta",
      "health_check_stream_completed",
    ]);

    expect(wsServer.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "health_check_stream_started",
        data: expect.objectContaining({
          modelName: "test-model",
          prompt: "test prompt",
          executionId: expect.any(String),
        }),
      }),
    );

    expect(wsServer.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "health_check_stream_delta",
        data: expect.objectContaining({
          modelName: "test-model",
          delta: "ok",
        }),
      }),
    );
  });
});
