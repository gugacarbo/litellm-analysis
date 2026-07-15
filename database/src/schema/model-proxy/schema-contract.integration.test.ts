import { eq, sql } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createTestDb } from "../../test-helpers/createTestDb";
import { modelProxyAliases } from "./aliases";
import { modelProxyModels } from "./models";
import { modelProxyProviders } from "./providers";

const describeWithTestDatabase = process.env.TEST_DATABASE_URL
  ? describe
  : describe.skip;

describeWithTestDatabase("model proxy schema physical constraints", () => {
  let testDatabase: Awaited<ReturnType<typeof createTestDb>>;

  beforeAll(async () => {
    testDatabase = await createTestDb();
  });

  afterEach(async () => {
    const { db } = testDatabase;
    await db.delete(modelProxyAliases);
    await db.delete(modelProxyModels);
    await db.delete(modelProxyProviders);
  });

  afterAll(async () => {
    await testDatabase.stop();
  });

  it("uses only the explicit isolated schema from TEST_DATABASE_URL", async () => {
    const expectedSchema = new URL(
      process.env.TEST_DATABASE_URL as string,
    ).searchParams.get("schema");
    const result = await testDatabase.db.execute(
      sql`SELECT current_schema() AS schema`,
    );

    expect(result.rows).toEqual([{ schema: expectedSchema }]);
  });

  it("enforces a provider, provider-scoped model identity, and restrictive deletion", async () => {
    const { db } = testDatabase;
    const [firstProvider] = await db
      .insert(modelProxyProviders)
      .values({ name: "first-provider" })
      .returning();
    const [secondProvider] = await db
      .insert(modelProxyProviders)
      .values({ name: "second-provider" })
      .returning();
    expect(firstProvider.revision).toBe(1);
    expect(secondProvider.revision).toBe(1);

    await expect(
      db.execute(
        sql`INSERT INTO model_proxy_models (model_id) VALUES ('orphan')`,
      ),
    ).rejects.toThrow();

    const [firstModel] = await db
      .insert(modelProxyModels)
      .values({
        providerId: firstProvider.id,
        modelId: "shared-model",
      })
      .returning();
    expect(firstModel.revision).toBe(1);
    await db.insert(modelProxyModels).values({
      providerId: secondProvider.id,
      modelId: "shared-model",
    });

    await expect(
      db.insert(modelProxyModels).values({
        providerId: firstProvider.id,
        modelId: "shared-model",
      }),
    ).rejects.toThrow();
    await expect(
      db
        .delete(modelProxyProviders)
        .where(eq(modelProxyProviders.id, firstProvider.id)),
    ).rejects.toThrow();
  });

  it("enforces the partial default constraint and relational alias target", async () => {
    const { db } = testDatabase;
    const [defaultProvider] = await db
      .insert(modelProxyProviders)
      .values({ name: "default-provider", isDefault: true })
      .returning();

    await expect(
      db.insert(modelProxyProviders).values({
        name: "second-default-provider",
        isDefault: true,
      }),
    ).rejects.toThrow();
    await db.insert(modelProxyProviders).values({
      name: "non-default-provider",
      isDefault: false,
    });

    await expect(
      db.insert(modelProxyAliases).values({
        alias: "missing-target",
        aliasNormalized: "missing-target",
        targetModelId: "00000000-0000-0000-0000-000000000000",
      }),
    ).rejects.toThrow();

    const [model] = await db
      .insert(modelProxyModels)
      .values({ providerId: defaultProvider.id, modelId: "alias-target" })
      .returning();
    const [alias] = await db
      .insert(modelProxyAliases)
      .values({
        alias: "target-alias",
        aliasNormalized: "target-alias",
        targetModelId: model.id,
      })
      .returning();
    expect(alias.revision).toBe(1);

    await expect(
      db.delete(modelProxyModels).where(eq(modelProxyModels.id, model.id)),
    ).rejects.toThrow();
  });

  it("uses the reset schema rather than storing provider credentials on the provider row", async () => {
    const { db } = testDatabase;

    await expect(
      db.execute(sql`SELECT api_key FROM model_proxy_providers LIMIT 1`),
    ).rejects.toThrow();
    await expect(
      db.execute(sql`SELECT secret_ref FROM model_proxy_providers LIMIT 1`),
    ).rejects.toThrow();
    await expect(
      db.execute(
        sql`SELECT credential_envelope FROM model_proxy_providers LIMIT 1`,
      ),
    ).rejects.toThrow();
  });
});
