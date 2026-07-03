import { beforeEach, describe, expect, it } from "vitest";
import { ApiKeysService } from "../api-keys.service.js";
import { createApiKeysRepositoryMock } from "./in-memory-repositories.js";

describe("ApiKeysService", () => {
  let service: ApiKeysService;

  beforeEach(() => {
    const repository = createApiKeysRepositoryMock();
    service = new ApiKeysService({
      repository: repository as never,
      hashKey: async (plain) => `hash:${plain}`,
      verifyKey: async (hash, plain) => hash === `hash:${plain}`,
      generateKey: () => "mp_test_generated_key",
    });
  });

  it("creates key with generated plaintext returned once", async () => {
    const created = await service.create({ label: "dev" });
    expect(created.plainKey).toBe("mp_test_generated_key");
    expect(created.record.keyHash).toBe("hash:mp_test_generated_key");
    expect(created.record.label).toBe("dev");
  });

  it("creates key with provided plaintext", async () => {
    const created = await service.create(
      { label: "ci" },
      "mp_custom_plain_key",
    );
    expect(created.plainKey).toBe("mp_custom_plain_key");
    expect(created.record.keyHash).toBe("hash:mp_custom_plain_key");
  });

  it("verifies enabled key and updates lastUsedAt", async () => {
    const created = await service.create({ label: "proxy" }, "mp_verify_me");
    expect(created.record.lastUsedAt).toBeNull();

    const result = await service.verify("mp_verify_me");
    expect(result.valid).toBe(true);
    expect(result.record?.lastUsedAt).toBeInstanceOf(Date);
  });

  it("rejects disabled keys", async () => {
    const created = await service.create({ label: "disabled" }, "mp_disabled");
    await service.disable(created.record.id);

    const result = await service.verify("mp_disabled");
    expect(result.valid).toBe(false);
  });

  it("returns invalid for unknown key", async () => {
    const result = await service.verify("mp_unknown");
    expect(result.valid).toBe(false);
  });

  it("lists and deletes keys", async () => {
    const created = await service.create({ label: "temp" });
    const rows = await service.list();
    expect(rows).toHaveLength(1);
    expect(await service.delete(created.record.id)).toBe(true);
    expect(await service.list()).toHaveLength(0);
  });
});
