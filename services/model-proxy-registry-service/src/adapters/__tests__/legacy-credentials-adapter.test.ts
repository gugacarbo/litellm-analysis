import { beforeEach, describe, expect, it, vi } from "vitest";
import { CredentialsRepository } from "../../repositories/credentials-repository.js";
import {
  deriveSecretRef,
  importLegacyCredentials,
  mapLegacyCredential,
} from "../legacy-credentials-adapter.js";

type CredentialRow = {
  id: string;
  name: string;
  provider: string | null;
  baseUrl: string | null;
  apiKey: string | null;
  secretRef: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function createCredentialsPrismaMock() {
  const rows = new Map<string, CredentialRow>();
  let idCounter = 1;

  return {
    modelProxyCredential: {
      findUnique: vi.fn(async ({ where }: { where: { name: string } }) => {
        return rows.get(where.name) ?? null;
      }),
      create: vi.fn(
        async (args: {
          data: {
            name: string;
            provider: string | null;
            baseUrl: string | null;
            secretRef: string | null;
            apiKey: string | null;
          };
        }) => {
          const now = new Date();
          const row: CredentialRow = {
            id: `cred_${idCounter++}`,
            name: args.data.name,
            provider: args.data.provider,
            baseUrl: args.data.baseUrl,
            apiKey: args.data.apiKey,
            secretRef: args.data.secretRef,
            createdAt: now,
            updatedAt: now,
          };
          rows.set(row.name, row);
          return row;
        },
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { name: string };
          data: Partial<{
            provider: string | null;
            baseUrl: string | null;
            secretRef: string | null;
          }>;
        }) => {
          const existing = rows.get(where.name);
          if (!existing) {
            const error = new Error("Not found") as Error & { code: string };
            error.code = "P2025";
            throw error;
          }
          const updated: CredentialRow = {
            ...existing,
            ...data,
            updatedAt: new Date(),
          };
          rows.set(where.name, updated);
          return updated;
        },
      ),
    },
  };
}

describe("legacy-credentials-adapter", () => {
  describe("deriveSecretRef", () => {
    it("normalizes credential names to env var names", () => {
      expect(deriveSecretRef("openai-main")).toBe("OPENAI_MAIN_API_KEY");
      expect(deriveSecretRef("ATplus Router")).toBe("ATPLUS_ROUTER_API_KEY");
      expect(deriveSecretRef("ALREADY_API_KEY")).toBe("ALREADY_API_KEY");
    });
  });

  describe("mapLegacyCredential", () => {
    it("maps provider and base_url without persisting api_key", () => {
      const mapped = mapLegacyCredential({
        credentialName: "openai-main",
        credentialValues: {
          api_key: "sk-secret",
          api_base: "https://api.openai.com/v1",
        },
        credentialInfo: { custom_llm_provider: "openai" },
      });

      expect(mapped.data).toEqual({
        name: "openai-main",
        provider: "openai",
        baseUrl: "https://api.openai.com/v1",
        secretRef: "OPENAI_MAIN_API_KEY",
        apiKey: null,
      });
      expect(mapped.requiredEnvVar).toEqual({
        credential: "openai-main",
        secretRef: "OPENAI_MAIN_API_KEY",
        action: "set env var before proxy start",
      });
    });

    it("flags unexpected credential_values keys", () => {
      const mapped = mapLegacyCredential({
        credentialName: "custom",
        credentialValues: { custom_field: "x" },
        credentialInfo: null,
      });

      expect(mapped.unexpectedKeys).toEqual(["custom_field"]);
      expect(mapped.data.secretRef).toBeNull();
    });
  });

  describe("importLegacyCredentials", () => {
    let repository: CredentialsRepository;

    beforeEach(() => {
      const prisma = createCredentialsPrismaMock();
      repository = new CredentialsRepository(prisma as never);
    });

    it("imports credentials with secretRef only via mocked reader", async () => {
      const summary = await importLegacyCredentials({
        repository,
        reader: {
          getAllCredentials: vi.fn(async () => [
            {
              credentialId: "1",
              credentialName: "openai-main",
              credentialValues: {
                api_key: "sk-secret",
                api_base: "https://api.openai.com/v1",
              },
              credentialInfo: { custom_llm_provider: "openai" },
              createdAt: null,
              createdBy: null,
              updatedAt: null,
              updatedBy: null,
            },
          ]),
        },
      });

      expect(summary.inserted).toBe(1);
      expect(summary.requiredEnvVars).toEqual([
        {
          credential: "openai-main",
          secretRef: "OPENAI_MAIN_API_KEY",
          action: "set env var before proxy start",
        },
      ]);

      const stored = await repository.findByName("openai-main");
      expect(stored?.secretRef).toBe("OPENAI_MAIN_API_KEY");
      expect(stored?.apiKey).toBeNull();
      expect(stored?.provider).toBe("openai");
    });

    it("skips existing credentials unless force is set", async () => {
      await repository.upsertLegacyImport(
        {
          name: "openai-main",
          provider: "openai",
          baseUrl: null,
          secretRef: "OLD_KEY",
        },
        false,
      );

      const summary = await importLegacyCredentials({
        repository,
        reader: {
          getAllCredentials: vi.fn(async () => [
            {
              credentialId: "1",
              credentialName: "openai-main",
              credentialValues: { api_key: "sk-secret" },
              credentialInfo: null,
              createdAt: null,
              createdBy: null,
              updatedAt: null,
              updatedBy: null,
            },
          ]),
        },
      });

      expect(summary.skipped).toBe(1);
      expect((await repository.findByName("openai-main"))?.secretRef).toBe(
        "OLD_KEY",
      );
    });
  });
});
