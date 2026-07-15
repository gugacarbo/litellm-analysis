import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { BenchmarkSyncConfigurationError } from "../application/benchmark-sync-application-service";
import { OpenRouterBenchmarkSyncConfigurationError } from "../application/openrouter-benchmark-sync-application-service";
import { createBenchmarkSyncRouter } from "../routes/benchmark-sync-routes";
import { createOpenRouterBenchmarkSyncRouter } from "../routes/openrouter-benchmark-sync-routes";

type HttpServer = {
  close: (callback: (error?: Error) => void) => void;
};

async function createSyncServer(
  router: ReturnType<typeof createBenchmarkSyncRouter>,
) {
  const express = (await import("express")).default;
  const app = express();
  app.use(router);
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  return { server, port: (server.address() as AddressInfo).port };
}

async function closeServer(server: HttpServer) {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

describe("benchmark sync routes", () => {
  const servers: HttpServer[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map(closeServer));
  });

  it("maps an async Artificial Analysis missing-key error to the compatibility code", async () => {
    const { server, port } = await createSyncServer(
      createBenchmarkSyncRouter({
        getStatus: () => ({}) as never,
        start: async () => {
          throw new BenchmarkSyncConfigurationError("missing");
        },
      } as never),
    );
    servers.push(server);

    const response = await fetch(`http://127.0.0.1:${port}/sync`, {
      method: "POST",
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: "ARTIFICIAL_ANALYSIS_API_KEY_MISSING",
    });
  });

  it("maps an async OpenRouter missing-key error to the compatibility code", async () => {
    const express = (await import("express")).default;
    const app = express();
    app.use(
      createOpenRouterBenchmarkSyncRouter({
        getStatus: () => ({}) as never,
        start: async () => {
          throw new OpenRouterBenchmarkSyncConfigurationError("missing");
        },
      } as never),
    );
    const server = app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    servers.push(server);
    const port = (server.address() as AddressInfo).port;

    const response = await fetch(`http://127.0.0.1:${port}/sync`, {
      method: "POST",
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: "OPENROUTER_API_KEY_MISSING",
    });
  });
});
