import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { modelProxyAliases } from "./aliases";
import { modelProxyModels } from "./models";
import { modelProxyProviders } from "./providers";

function findIndex(table: Parameters<typeof getTableConfig>[0], name: string) {
  return getTableConfig(table).indexes.find(
    (index) => index.config.name === name,
  );
}

describe("model proxy clean-cut schema", () => {
  it("requires a provider and prevents duplicate model ids inside one provider", () => {
    const providerForeignKey = getTableConfig(
      modelProxyModels,
    ).foreignKeys.find((foreignKey) =>
      foreignKey
        .reference()
        .columns.some((column) => column.name === "provider_id"),
    );
    const providerModelIndex = findIndex(
      modelProxyModels,
      "uq_model_proxy_models_provider_model",
    );

    expect(modelProxyModels.providerId.notNull).toBe(true);
    expect(providerForeignKey?.onDelete).toBe("restrict");
    expect(providerModelIndex?.config.unique).toBe(true);
    expect(
      providerModelIndex?.config.columns.map(
        (column) => (column as { name?: string }).name,
      ),
    ).toEqual(["provider_id", "model_id"]);
    expect(modelProxyModels.revision.notNull).toBe(true);
  });

  it("keeps the optional provider default physically unique and removes legacy credentials", () => {
    const defaultIndex = findIndex(
      modelProxyProviders,
      "uq_model_proxy_providers_single_default",
    );

    expect(modelProxyProviders.revision.notNull).toBe(true);
    expect(defaultIndex?.config.unique).toBe(true);
    expect(defaultIndex?.config.where).toBeDefined();
    expect(modelProxyProviders).toHaveProperty("credentialEnvelope");
    expect(modelProxyProviders).not.toHaveProperty("apiKey");
    expect(modelProxyProviders).not.toHaveProperty("secretRef");
  });

  it("stores manual aliases as revisioned rows with a restrictive UUID target", () => {
    const targetForeignKey = getTableConfig(modelProxyAliases).foreignKeys.find(
      (foreignKey) =>
        foreignKey
          .reference()
          .columns.some((column) => column.name === "target_model_id"),
    );
    const normalizedIndex = findIndex(
      modelProxyAliases,
      "uq_model_proxy_aliases_normalized",
    );

    expect(modelProxyAliases.targetModelId.notNull).toBe(true);
    expect(targetForeignKey?.onDelete).toBe("restrict");
    expect(modelProxyAliases.revision.notNull).toBe(true);
    expect(normalizedIndex?.config.unique).toBe(true);
    expect(
      normalizedIndex?.config.columns.map(
        (column) => (column as { name?: string }).name,
      ),
    ).toEqual(["alias_normalized"]);
  });
});
