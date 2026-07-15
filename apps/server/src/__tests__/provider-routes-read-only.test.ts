import type { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";

async function createProviderServer() {
  const express = (await import("express")).default;
  const { registerProviderRoutes } = await import(
    "../../../../packages/server/src/routes/provider-routes"
  );
  const app = express();
  app.use(express.json());
  registerProviderRoutes(app, {
    dataSource: {
      getDefaultProvider: vi.fn(async () => "new-provider"),
    },
  } as never);

  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const port = (server.address() as AddressInfo).port;
  return { server, port };
}

async function closeServer(server: ReturnType<typeof createServer>) {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

describe("legacy provider routes", () => {
  const servers: ReturnType<typeof createServer>[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map(closeServer));
  });

  it("keeps only the default-provider read boundary", async () => {
    const { server, port } = await createProviderServer();
    servers.push(server);
    const baseUrl = `http://127.0.0.1:${port}`;

    await expect(fetch(`${baseUrl}/providers/default`)).resolves.toMatchObject({
      status: 200,
    });
    await expect(
      fetch(`${baseUrl}/providers`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "legacy-provider",
          provider: "openai",
          apiKey: "legacy-secret",
        }),
      }),
    ).resolves.toMatchObject({ status: 404 });
    await expect(
      fetch(`${baseUrl}/providers/legacy-provider`, { method: "DELETE" }),
    ).resolves.toMatchObject({ status: 404 });
  });
});
