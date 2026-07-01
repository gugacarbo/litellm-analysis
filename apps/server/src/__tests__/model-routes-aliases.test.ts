import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRegistryTestStack } from "./helpers/registry-test-stack";

async function createModelsServer(stack = createRegistryTestStack()) {
  const express = (await import("express")).default;
  const { registerModelRoutes } = await import(
    "../../../../packages/server/src/routes/model-routes.ts"
  );

  const app = express();
  app.use(express.json());
  registerModelRoutes(app, stack.routeOptions);

  const server = app.listen(0);
  await new Promise<void>((resolve) => {
    server.once("listening", () => resolve());
  });

  const port = (server.address() as AddressInfo).port;
  return { port, server, stack };
}

async function closeServer(server: {
  close: (cb: (error?: Error) => void) => void;
}) {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

describe("model route aliases", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("supports manual alias CRUD through model routes", async () => {
    const stack = createRegistryTestStack();
    await stack.seedRegistryModel("gpt-4o");
    await stack.seedRegistryModel("gpt-4o-mini");
    const { port, server } = await createModelsServer(stack);

    try {
      const updateResponse = await fetch(
        `http://127.0.0.1:${port}/models/gpt-4o/aliases`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ aliases: ["fast", "prod"] }),
        },
      );
      expect(updateResponse.status).toBe(200);
      expect(await updateResponse.json()).toEqual({
        aliases: [
          { alias: "fast", targetModel: "gpt-4o" },
          { alias: "prod", targetModel: "gpt-4o" },
        ],
      });

      const listResponse = await fetch(
        `http://127.0.0.1:${port}/models/aliases`,
      );
      expect(listResponse.status).toBe(200);
      expect(await listResponse.json()).toEqual({
        aliases: [
          { alias: "fast", targetModel: "gpt-4o" },
          { alias: "prod", targetModel: "gpt-4o" },
        ],
      });

      const targetResponse = await fetch(
        `http://127.0.0.1:${port}/models/gpt-4o/aliases`,
      );
      expect(targetResponse.status).toBe(200);
      expect(await targetResponse.json()).toEqual({
        modelName: "gpt-4o",
        aliases: ["fast", "prod"],
      });

      const deleteResponse = await fetch(
        `http://127.0.0.1:${port}/models/aliases/prod`,
        { method: "DELETE" },
      );
      expect(deleteResponse.status).toBe(200);
      expect(await deleteResponse.json()).toEqual({ success: true });

      const afterDeleteResponse = await fetch(
        `http://127.0.0.1:${port}/models/gpt-4o/aliases`,
      );
      expect(afterDeleteResponse.status).toBe(200);
      expect(await afterDeleteResponse.json()).toEqual({
        modelName: "gpt-4o",
        aliases: ["fast"],
      });

      const trimmedTargetResponse = await fetch(
        `http://127.0.0.1:${port}/models/%20gpt-4o%20/aliases`,
      );
      expect(trimmedTargetResponse.status).toBe(200);
      expect(await trimmedTargetResponse.json()).toEqual({
        modelName: "gpt-4o",
        aliases: ["fast"],
      });
    } finally {
      await closeServer(server);
    }
  });

  it("rejects invalid alias writes with actionable 4xx errors", async () => {
    const stack = createRegistryTestStack();
    await stack.seedRegistryModel("gpt-4o");
    await stack.seedRegistryModel("gpt-4o-mini");
    await stack.registry.settingsService.setRouterSettings({
      model_group_alias: {
        generated: "gpt-4o-mini",
        helper: "gpt-4o",
      },
      __lite_llm_analytics: {
        managedModelGroupAliasKeys: ["generated"],
        manualModelAliasKeys: ["helper"],
      },
    });
    const { port, server } = await createModelsServer(stack);

    try {
      const duplicateResponse = await fetch(
        `http://127.0.0.1:${port}/models/gpt-4o/aliases`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ aliases: ["dup", " dup "] }),
        },
      );
      expect(duplicateResponse.status).toBe(400);
      expect(await duplicateResponse.json()).toEqual({
        error: "Duplicate aliases are not allowed: dup.",
      });

      const generatedCollisionResponse = await fetch(
        `http://127.0.0.1:${port}/models/gpt-4o/aliases`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ aliases: ["generated"] }),
        },
      );
      expect(generatedCollisionResponse.status).toBe(409);
      expect(await generatedCollisionResponse.json()).toEqual({
        error:
          'Alias "generated" is managed by generated routing. Remove or rename the managed alias before assigning it manually.',
      });

      const modelCollisionResponse = await fetch(
        `http://127.0.0.1:${port}/models/gpt-4o/aliases`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ aliases: ["gpt-4o-mini"] }),
        },
      );
      expect(modelCollisionResponse.status).toBe(400);
      expect(await modelCollisionResponse.json()).toEqual({
        error:
          'Alias "gpt-4o-mini" matches an existing model name. Choose a name that does not collide with a real model.',
      });

      const aliasTargetResponse = await fetch(
        `http://127.0.0.1:${port}/models/helper/aliases`,
      );
      expect(aliasTargetResponse.status).toBe(400);
      expect(await aliasTargetResponse.json()).toEqual({
        error:
          'Manual aliases must target a real model name. "helper" is already an alias for "gpt-4o".',
      });

      const missingTargetResponse = await fetch(
        `http://127.0.0.1:${port}/models/missing-model/aliases`,
      );
      expect(missingTargetResponse.status).toBe(404);
      expect(await missingTargetResponse.json()).toEqual({
        error:
          'Model "missing-model" not found. Create the target model before assigning manual aliases.',
      });
    } finally {
      await closeServer(server);
    }
  });

  it("retargets manual aliases when a model is renamed", async () => {
    const stack = createRegistryTestStack();
    await stack.seedRegistryModel("gpt-4o");
    await stack.seedConfigModel("gpt-4o");
    await stack.registry.settingsService.setRouterSettings({
      model_group_alias: {
        fast: "gpt-4o",
      },
      __lite_llm_analytics: {
        manualModelAliasKeys: ["fast"],
      },
    });
    const { port, server } = await createModelsServer(stack);

    try {
      const renameResponse = await fetch(
        `http://127.0.0.1:${port}/models/gpt-4o`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            modelName: "gpt-4.1",
            modelRoute: {
              modelName: "gpt-4.1",
              inputCostPerToken: 0.000001,
            },
          }),
        },
      );
      expect(renameResponse.status).toBe(200);
      expect(await renameResponse.json()).toEqual({ success: true });

      const aliasesResponse = await fetch(
        `http://127.0.0.1:${port}/models/gpt-4.1/aliases`,
      );
      expect(aliasesResponse.status).toBe(200);
      expect(await aliasesResponse.json()).toEqual({
        modelName: "gpt-4.1",
        aliases: ["fast"],
      });

      const allAliasesResponse = await fetch(
        `http://127.0.0.1:${port}/models/aliases`,
      );
      expect(allAliasesResponse.status).toBe(200);
      expect(await allAliasesResponse.json()).toEqual({
        aliases: [{ alias: "fast", targetModel: "gpt-4.1" }],
      });
    } finally {
      await closeServer(server);
    }
  });

  it("rolls back the registry rename if alias retargeting fails", async () => {
    const stack = createRegistryTestStack();
    await stack.seedRegistryModel("gpt-4o");
    await stack.seedConfigModel("gpt-4o");
    await stack.registry.settingsService.setRouterSettings({
      model_group_alias: {
        fast: "gpt-4o",
      },
      __lite_llm_analytics: {
        manualModelAliasKeys: ["fast"],
      },
    });
    vi.spyOn(
      stack.registry.settingsService,
      "setRouterSettings",
    ).mockRejectedValueOnce(new Error("alias retarget failed"));
    const { port, server } = await createModelsServer(stack);

    try {
      const renameResponse = await fetch(
        `http://127.0.0.1:${port}/models/gpt-4o`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            modelName: "gpt-4.1",
            modelRoute: {
              modelName: "gpt-4.1",
              inputCostPerToken: 0.000001,
            },
          }),
        },
      );

      expect(renameResponse.status).toBe(500);
      expect(await renameResponse.json()).toEqual({
        error: "Error: alias retarget failed",
      });

      expect(
        await stack.registry.registryModelsService.getRoute("gpt-4o"),
      ).toMatchObject({
        modelName: "gpt-4o",
      });
      expect(
        await stack.registry.registryModelsService.getRoute("gpt-4.1"),
      ).toBeNull();

      const aliasesResponse = await fetch(
        `http://127.0.0.1:${port}/models/gpt-4o/aliases`,
      );
      expect(aliasesResponse.status).toBe(200);
      expect(await aliasesResponse.json()).toEqual({
        modelName: "gpt-4o",
        aliases: ["fast"],
      });
    } finally {
      await closeServer(server);
    }
  });

  it("blocks model deletion while manual aliases still point to the model", async () => {
    const stack = createRegistryTestStack();
    await stack.seedRegistryModel("gpt-4o");
    await stack.seedConfigModel("gpt-4o");
    await stack.registry.settingsService.setRouterSettings({
      model_group_alias: {
        fast: "gpt-4o",
      },
      __lite_llm_analytics: {
        manualModelAliasKeys: ["fast"],
      },
    });
    const { port, server } = await createModelsServer(stack);

    try {
      const deleteResponse = await fetch(
        `http://127.0.0.1:${port}/models/gpt-4o`,
        {
          method: "DELETE",
        },
      );
      expect(deleteResponse.status).toBe(409);
      expect(await deleteResponse.json()).toEqual({
        error:
          'Cannot delete model "gpt-4o" because manual aliases still point to it: fast. Remove or retarget those aliases first.',
      });

      const existingRoute =
        await stack.registry.registryModelsService.getRoute("gpt-4o");
      expect(existingRoute).not.toBeNull();
    } finally {
      await closeServer(server);
    }
  });
});
