import { describe, expect, it } from "vitest";
import { listRegistryModels, toRegistryEntry } from "../models-dual-read.js";

describe("models-dual-read", () => {
  it("falls back to modelName when modelId is missing", () => {
    const entry = toRegistryEntry({
      modelName: "legacy-model",
    } as never);

    expect(entry).toEqual({
      modelName: "legacy-model",
      modelRoute: {
        modelId: "legacy-model",
        modelName: "legacy-model",
      },
    });
  });

  it("lists registry models without crashing on missing ids", async () => {
    const service = {
      listRoutes: async () => [{ modelName: "zeta" }, { modelId: "alpha" }],
    };

    const models = await listRegistryModels(service as never);

    expect(models.map((model) => model.modelName)).toEqual(["alpha", "zeta"]);
  });
});
