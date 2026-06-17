import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createStreamingBody(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

async function createTestServer() {
  vi.resetModules();
  vi.stubEnv("PORT", "3008");
  vi.stubEnv("DB_HOST", "localhost");
  vi.stubEnv("DB_PORT", "5432");
  vi.stubEnv("DB_NAME", "litellm");
  vi.stubEnv("DB_USER", "postgres");
  vi.stubEnv("DB_PASSWORD", "postgres");
  vi.stubEnv("HEALTH_CHECK_INTERVAL_MS", "60000");
  vi.stubEnv("HEALTH_CHECK_TIMEOUT_MS", "30000");
  vi.stubEnv("APP_DB_PATH", "/tmp/model-proxy-test.db");
  vi.stubEnv("MODEL_PROXY_API_KEY", "proxy-secret");

  const express = (await import("express")).default;
  const { registerModelProxyRoutes } = await import(
    "../../../../packages/server/src/routes/model-proxy-routes.ts"
  );

  const app = express();
  app.use(express.json());

  const modelProxyService = {
    listModels: vi.fn().mockResolvedValue({
      object: "list",
      data: [
        {
          id: "gpt-test",
          object: "model",
          created: 1,
          owned_by: "openai",
        },
      ],
    }),
    createChatCompletion: vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      payload: {
        id: "chatcmpl_1",
        object: "chat.completion",
        choices: [{ index: 0, message: { role: "assistant", content: "ok" } }],
      },
    }),
    createStreamingChatCompletion: vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers({ "content-type": "text/event-stream" }),
      body: createStreamingBody([
        'data: {"choices":[{"delta":{"content":"ok"}}]}\n\n',
        "data: [DONE]\n\n",
      ]),
    }),
    onRequestFinished: vi.fn().mockReturnValue(() => undefined),
  };

  registerModelProxyRoutes(app, {
    modelProxyService,
    agentsManager: undefined,
    dataSource: {} as never,
    orchestration: {} as never,
    modelsService: {} as never,
    providerService: {} as never,
  });

  const server = app.listen(0);
  await new Promise<void>((resolve) => {
    server.once("listening", () => resolve());
  });

  const port = (server.address() as AddressInfo).port;
  return { modelProxyService, port, server };
}

describe("model proxy routes", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns 401 without auth", async () => {
    const { port, server } = await createTestServer();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/v1/models`);
      expect(response.status).toBe(401);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("returns model list for authorized requests", async () => {
    const { port, server, modelProxyService } = await createTestServer();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/v1/models`, {
        headers: { authorization: "Bearer proxy-secret" },
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        object: "list",
        data: [
          {
            id: "gpt-test",
            object: "model",
            created: 1,
            owned_by: "openai",
          },
        ],
      });
      expect(modelProxyService.listModels).toHaveBeenCalledOnce();
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("streams SSE responses", async () => {
    const { port, server, modelProxyService } = await createTestServer();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            authorization: "Bearer proxy-secret",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-test",
            stream: true,
            messages: [{ role: "user", content: "hello" }],
          }),
        },
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain(
        "text/event-stream",
      );
      expect(await response.text()).toContain("[DONE]");
      expect(
        modelProxyService.createStreamingChatCompletion,
      ).toHaveBeenCalledOnce();
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
