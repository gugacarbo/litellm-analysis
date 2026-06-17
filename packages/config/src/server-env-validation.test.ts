import { describe, expect, it } from "vitest";
import { assertAnalyticsDataSourceEnv } from "./server-env-validation";

describe("assertAnalyticsDataSourceEnv", () => {
  it("accepts model-proxy when MODEL_PROXY_DATABASE_URL is set", () => {
    expect(() =>
      assertAnalyticsDataSourceEnv({
        MODEL_PROXY_DATABASE_URL:
          "postgresql://proxy:secret@localhost:5432/model_proxy",
      }),
    ).not.toThrow();
  });

  it("requires MODEL_PROXY_DATABASE_URL", () => {
    expect(() => assertAnalyticsDataSourceEnv({})).toThrow(
      "MODEL_PROXY_DATABASE_URL is required",
    );
  });
});
