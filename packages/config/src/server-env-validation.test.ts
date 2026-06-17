import { describe, expect, it } from "vitest";
import { assertAnalyticsDataSourceEnv } from "./server-env-validation";

const DB_ENV = {
  DB_HOST: "localhost",
  DB_PORT: 5432,
  DB_NAME: "litellm",
  DB_USER: "postgres",
  DB_PASSWORD: "postgres",
} as const;

describe("assertAnalyticsDataSourceEnv", () => {
  it("accepts model-proxy without DB_* when MODEL_PROXY_DATABASE_URL is set", () => {
    expect(() =>
      assertAnalyticsDataSourceEnv({
        ANALYTICS_DATA_SOURCE: "model-proxy",
        MODEL_PROXY_DATABASE_URL:
          "postgresql://proxy:secret@localhost:5432/model_proxy",
      }),
    ).not.toThrow();
  });

  it("requires MODEL_PROXY_DATABASE_URL for model-proxy mode", () => {
    expect(() =>
      assertAnalyticsDataSourceEnv({
        ANALYTICS_DATA_SOURCE: "model-proxy",
      }),
    ).toThrow(
      "MODEL_PROXY_DATABASE_URL is required when ANALYTICS_DATA_SOURCE=model-proxy",
    );
  });

  it("requires DB_* for litellm mode", () => {
    expect(() =>
      assertAnalyticsDataSourceEnv({
        ANALYTICS_DATA_SOURCE: "litellm",
      }),
    ).toThrow(
      "DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD required when ANALYTICS_DATA_SOURCE=litellm",
    );
  });

  it("requires MODEL_PROXY_DATABASE_URL for hybrid mode", () => {
    expect(() =>
      assertAnalyticsDataSourceEnv({
        ANALYTICS_DATA_SOURCE: "hybrid",
        ...DB_ENV,
      }),
    ).toThrow(
      "MODEL_PROXY_DATABASE_URL is required when ANALYTICS_DATA_SOURCE=hybrid",
    );
  });

  it("accepts hybrid when both DB_* and MODEL_PROXY_DATABASE_URL are set", () => {
    expect(() =>
      assertAnalyticsDataSourceEnv({
        ANALYTICS_DATA_SOURCE: "hybrid",
        MODEL_PROXY_DATABASE_URL:
          "postgresql://proxy:secret@localhost:5432/model_proxy",
        ...DB_ENV,
      }),
    ).not.toThrow();
  });
});
