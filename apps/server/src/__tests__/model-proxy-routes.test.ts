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
  vi.stubEnv("ANALYTICS_DATA_SOURCE", "model-proxy");
  vi.stubEnv(
    "MODEL_PROXY_DATABASE_URL",
    "postgresql://proxy:secret@localhost:5432/model_proxy",
  );
  vi.stubEnv("APP_DB_PATH", "/tmp/model-proxy-test.db");
  vi.stubEnv("MODEL_PROXY_API_KEY", "proxy-secret");

  const express = (await import("express")).default;
  const { registerModelProxyRoutes } = await import(
    "../../../../packages/server/src/routes/model-proxy-routes.ts"
  );

  const app = express();

  const apiKeysService = {
    list: vi.fn().mockResolvedValue([]),
    verify: vi.fn().mockResolvedValue({ valid: false }),
  };

  const handlerCalls: Array<{
    state?: Record<string, unknown>;
    url: string;
  }> = [];

  const heboGateway = {
    handler: vi.fn(async (req: Request, state?: Record<string, unknown>) => {
      handlerCalls.push({ url: req.url, state });
      const pathname = new URL(req.url).pathname;

      if (pathname.endsWith("/models")) {
        return Response.json({
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
      }

      if (pathname.endsWith("/responses")) {
        const body = (await req.json()) as { stream?: boolean };
        if (body.stream) {
          return new Response(
            createStreamingBody([
              'data: {"type":"response.output_text.delta","delta":"ok"}\n\n',
              "data: [DONE]\n\n",
            ]),
            {
              status: 200,
              headers: { "content-type": "text/event-stream" },
            },
          );
        }

        return Response.json({
          id: "resp_1",
          object: "response",
          output: [{ type: "message", role: "assistant", content: "ok" }],
        });
      }

      if (pathname.endsWith("/chat/completions")) {
        const body = (await req.json()) as { stream?: boolean };
        if (body.stream) {
          return new Response(
            createStreamingBody([
              'data: {"choices":[{"delta":{"content":"ok"}}]}\n\n',
              "data: [DONE]\n\n",
            ]),
            {
              status: 200,
              headers: { "content-type": "text/event-stream" },
            },
          );
        }

        return Response.json({
          id: "chatcmpl_1",
          object: "chat.completion",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: "ok" },
            },
          ],
        });
      }

      return Response.json({ error: "Not Found" }, { status: 404 });
    }),
    onRequestFinished: vi.fn().mockReturnValue(() => undefined),
    refresh: vi.fn().mockResolvedValue(undefined),
  };

  registerModelProxyRoutes(app, {
    heboGateway,
    agentsManager: undefined,
    dataSource: {} as never,
    orchestration: {} as never,
    modelsService: {} as never,
    providerService: {} as never,
    registry: {
      settingsService: {} as never,
      registryModelsService: {} as never,
      apiKeysService,
    },
  });

  const server = app.listen(0);
  await new Promise<void>((resolve) => {
    server.once("listening", () => resolve());
  });

  const port = (server.address() as AddressInfo).port;
  return { handlerCalls, heboGateway, port, server };
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
    const { port, server, heboGateway } = await createTestServer();
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
      expect(heboGateway.handler).toHaveBeenCalledOnce();
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("authorizes requests with a matching registry API key", async () => {
    vi.resetModules();
    vi.stubEnv("MODEL_PROXY_API_KEY", "");
    vi.stubEnv("PORT", "3008");
    vi.stubEnv("ANALYTICS_DATA_SOURCE", "model-proxy");
    vi.stubEnv(
      "MODEL_PROXY_DATABASE_URL",
      "postgresql://proxy:secret@localhost:5432/model_proxy",
    );
    vi.stubEnv("APP_DB_PATH", "/tmp/model-proxy-test.db");

    const express = (await import("express")).default;
    const { registerModelProxyRoutes } = await import(
      "../../../../packages/server/src/routes/model-proxy-routes.ts"
    );
    const app = express();

    const apiKeysService = {
      list: vi
        .fn()
        .mockResolvedValue([
          { id: "1", label: "test", keyHash: "hash", enabled: true },
        ]),
      verify: vi.fn().mockResolvedValue({ valid: true }),
    };
    const heboGateway = {
      handler: vi
        .fn()
        .mockResolvedValue(Response.json({ object: "list", data: [] })),
      onRequestFinished: vi.fn().mockReturnValue(() => undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
    };

    registerModelProxyRoutes(app, {
      heboGateway,
      agentsManager: undefined,
      dataSource: {} as never,
      orchestration: {} as never,
      modelsService: {} as never,
      providerService: {} as never,
      registry: {
        settingsService: {} as never,
        registryModelsService: {} as never,
        apiKeysService,
      },
    });

    const server = app.listen(0);
    await new Promise<void>((resolve) => {
      server.once("listening", () => resolve());
    });
    const port = (server.address() as AddressInfo).port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/v1/models`, {
        headers: { authorization: "Bearer registry-key" },
      });
      expect(response.status).toBe(200);
      expect(apiKeysService.verify).toHaveBeenCalledWith("registry-key");
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("passes api key alias to the hebo gateway handler", async () => {
    const { port, server, handlerCalls } = await createTestServer();
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
            stream: false,
            user: "alice",
            messages: [{ role: "user", content: "hello" }],
          }),
        },
      );

      expect(response.status).toBe(200);
      expect(handlerCalls.at(-1)?.state).toEqual({
        apiKeyAlias: "MODEL_PROXY_API_KEY",
      });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("proxies OpenAI Responses API requests", async () => {
    const { port, server } = await createTestServer();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/v1/responses`, {
        method: "POST",
        headers: {
          authorization: "Bearer proxy-secret",
          "content-type": "application/json",
        },
        body: JSON.stringify({ model: "gpt-test", input: "hello" }),
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.object).toBe("response");
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("streams Responses API SSE payloads", async () => {
    const { port, server } = await createTestServer();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/v1/responses`, {
        method: "POST",
        headers: {
          authorization: "Bearer proxy-secret",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-test",
          input: "hello",
          stream: true,
        }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain(
        "text/event-stream",
      );
      expect(await response.text()).toContain("[DONE]");
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("streams SSE responses", async () => {
    const { port, server } = await createTestServer();
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
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
