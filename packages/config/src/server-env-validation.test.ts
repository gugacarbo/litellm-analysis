import { describe, expect, it } from "vitest";
import { assertAnalyticsDataSourceEnv } from "./server-env-validation";

describe("assertAnalyticsDataSourceEnv", () => {
  it("accepts model-proxy when DATABASE_URL is set", () => {
    expect(() =>
      assertAnalyticsDataSourceEnv({
        DATABASE_URL:
          "postgresql://proxy:secret@localhost:5432/model_proxy",
      }),
    ).not.toThrow();
  });

  it("requires DATABASE_URL", () => {
    expect(() => assertAnalyticsDataSourceEnv({})).toThrow(
      "DATABASE_URL is required",
    );
  });
});
