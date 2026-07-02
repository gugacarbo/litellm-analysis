import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function stubBaseEnv(apiKey = "proxy-secret") {
  vi.stubEnv("PORT", "3008");
  vi.stubEnv("ANALYTICS_DATA_SOURCE", "model-proxy");
  vi.stubEnv(
    "MODEL_PROXY_DATABASE_URL",
    "postgresql://proxy:secret@localhost:5432/model_proxy",
  );
  vi.stubEnv("APP_DB_PATH", "/tmp/chat-routes-test.db");
  vi.stubEnv("MODEL_PROXY_API_KEY", apiKey);
  vi.stubEnv("MODEL_PROXY_BASE_URL", "http://localhost:3008/v1");
}

async function createTestServer(apiKey = "proxy-secret") {
  vi.resetModules();
  stubBaseEnv(apiKey);

  const express = (await import("express")).default;
  const { registerChatRoutes } = await import(
    "../../../../packages/server/src/routes/chat-routes.ts"
  );

  const app = express();
  app.use(express.json());
  registerChatRoutes(app, {} as never);

  const server = app.listen(0);
  await new Promise<void>((resolve) => {
    server.once("listening", () => resolve());
  });

  const port = (server.address() as AddressInfo).port;
  return { port, server };
}

describe("chat routes", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 400 when config.modelName is missing", async () => {
    const { port, server } = await createTestServer();

    try {
      const response = await fetch(`http://127.0.0.1:${port}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "config.modelName is required",
      });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("returns 503 when MODEL_PROXY_API_KEY is not configured", async () => {
    const { port, server } = await createTestServer("");

    try {
      const response = await fetch(`http://127.0.0.1:${port}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [],
          config: { modelName: "gpt-test" },
        }),
      });

      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toEqual({
        error: "MODEL_PROXY_API_KEY is not configured",
      });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
