import { describe, expect, it } from "vitest";
import { unregisterLegacyMutationRoutes } from "./legacy-route-guard";

describe("unregisterLegacyMutationRoutes", () => {
  it("removes legacy configuration writers and preserves GET routes in Express 4", async () => {
    const express = (await import("express")).default;
    const app = express();
    app.get("/models", (_req, res) => res.sendStatus(200));
    app.post("/models", (_req, res) => res.sendStatus(201));
    app.put("/models/foo/aliases", (_req, res) => res.sendStatus(200));
    app.patch("/plugin-routing", (_req, res) => res.sendStatus(200));
    app.post("/chat", (_req, res) => res.sendStatus(200));

    unregisterLegacyMutationRoutes(app);

    const stack = (app as unknown as { _router?: { stack?: Array<{ route?: { path?: string; methods?: Record<string, boolean> } }> } })._router?.stack ?? [];
    const routes = stack.flatMap((layer) =>
      layer.route ? [{ path: layer.route.path, methods: layer.route.methods }] : [],
    );
    expect(routes).toEqual([
      { path: "/models", methods: expect.objectContaining({ get: true }) },
      { path: "/chat", methods: expect.objectContaining({ post: true }) },
    ]);
  });
});
