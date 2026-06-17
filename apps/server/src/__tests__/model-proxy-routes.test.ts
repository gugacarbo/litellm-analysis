import type { AddressInfo } from "node:net";
import type { ProxyEndpointResult } from "@lite-llm/model-proxy-service";
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

  const apiKeysService = {
    list: vi.fn().mockResolvedValue([]),
    verify: vi.fn().mockResolvedValue({ valid: false }),
  };

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
    proxyOpenAiEndpoint: vi.fn(
      async (
        endpoint: string,
        body: { stream?: boolean },
      ): Promise<ProxyEndpointResult> => {
        if (body.stream) {
          return {
            kind: "stream",
            response: {
              status: 200,
              headers: new Headers({ "content-type": "text/event-stream" }),
              body: createStreamingBody(
                endpoint === "responses"
                  ? [
                      'data: {"type":"response.output_text.delta","delta":"ok"}\n\n',
                      "data: [DONE]\n\n",
                    ]
                  : [
                      'data: {"choices":[{"delta":{"content":"ok"}}]}\n\n',
                      "data: [DONE]\n\n",
                    ],
              ),
            },
          };
        }

        return {
          kind: "json",
          response: {
            status: 200,
            headers: new Headers({ "content-type": "application/json" }),
            payload:
              endpoint === "responses"
                ? {
                    id: "resp_1",
                    object: "response",
                    output: [
                      { type: "message", role: "assistant", content: "ok" },
                    ],
                  }
                : {
                    id: "chatcmpl_1",
                    object: "chat.completion",
                    choices: [
                      {
                        index: 0,
                        message: { role: "assistant", content: "ok" },
                      },
                    ],
                  },
          },
        };
      },
    ),
    onRequestFinished: vi.fn().mockReturnValue(() => undefined),
  };

  registerModelProxyRoutes(app, {
    modelProxyService,
    agentsManager: undefined,
    dataSource: {} as never,
    orchestration: {} as never,
    modelsService: {} as never,
    providerService: {} as never,
    registry: {
      settingsService: {} as never,
      registryModelsService: {} as never,
      credentialsService: {} as never,
      apiKeysService,
    },
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

  it("authorizes requests with a matching registry API key", async () => {
    vi.resetModules();
    vi.stubEnv("MODEL_PROXY_API_KEY", "");
    vi.stubEnv("PORT", "3008");
    vi.stubEnv("ANALYTICS_DATA_SOURCE", "model-proxy");
    vi.stubEnv(
      "MODEL_PROXY_DATABASE_URL",
      "postgresql://proxy:secret@localhost:5432/model_proxy",
    );
    vi.stubEnv("HEALTH_CHECK_INTERVAL_MS", "60000");
    vi.stubEnv("HEALTH_CHECK_TIMEOUT_MS", "30000");
    vi.stubEnv("APP_DB_PATH", "/tmp/model-proxy-test.db");

    const express = (await import("express")).default;
    const { registerModelProxyRoutes } = await import(
      "../../../../packages/server/src/routes/model-proxy-routes.ts"
    );
    const app = express();
    app.use(express.json());

    const apiKeysService = {
      list: vi
        .fn()
        .mockResolvedValue([
          { id: "1", label: "test", keyHash: "hash", enabled: true },
        ]),
      verify: vi.fn().mockResolvedValue({ valid: true }),
    };
    const modelProxyService = {
      listModels: vi.fn().mockResolvedValue({ object: "list", data: [] }),
      createChatCompletion: vi.fn(),
      createStreamingChatCompletion: vi.fn(),
      onRequestFinished: vi.fn().mockReturnValue(() => undefined),
    };

    registerModelProxyRoutes(app, {
      modelProxyService,
      agentsManager: undefined,
      dataSource: {} as never,
      orchestration: {} as never,
      modelsService: {} as never,
      providerService: {} as never,
      registry: {
        settingsService: {} as never,
        registryModelsService: {} as never,
        credentialsService: {} as never,
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

  it("passes api key alias to chat completion handler", async () => {
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
            stream: false,
            user: "alice",
            messages: [{ role: "user", content: "hello" }],
          }),
        },
      );

      expect(response.status).toBe(200);
      expect(modelProxyService.proxyOpenAiEndpoint).toHaveBeenCalledWith(
        "chat/completions",
        expect.objectContaining({ user: "alice" }),
        expect.any(AbortSignal),
        { apiKeyAlias: "MODEL_PROXY_API_KEY" },
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("proxies OpenAI Responses API requests", async () => {
    const { port, server, modelProxyService } = await createTestServer();
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
      expect(modelProxyService.proxyOpenAiEndpoint).toHaveBeenCalledWith(
        "responses",
        expect.objectContaining({ model: "gpt-test", input: "hello" }),
        expect.any(AbortSignal),
        { apiKeyAlias: "MODEL_PROXY_API_KEY" },
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("streams Responses API SSE payloads", async () => {
    const { port, server, modelProxyService } = await createTestServer();
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
      expect(modelProxyService.proxyOpenAiEndpoint).toHaveBeenCalledWith(
        "responses",
        expect.objectContaining({ stream: true }),
        expect.any(AbortSignal),
        { apiKeyAlias: "MODEL_PROXY_API_KEY" },
      );
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
      expect(modelProxyService.proxyOpenAiEndpoint).toHaveBeenCalledWith(
        "chat/completions",
        expect.objectContaining({ stream: true }),
        expect.any(AbortSignal),
        { apiKeyAlias: "MODEL_PROXY_API_KEY" },
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
