import { vi } from "vitest";
import { createMockDataSource } from "./create-mock-data-source";
export async function createTestServer(overrides = {}) {
  const { createApiServer } = await import("../../runtime/api-server");
  const mockDs = createMockDataSource(overrides);
  const orchestration = {
    dataSource: mockDs,
    buildAliasMap: vi.fn().mockResolvedValue({}),
    regenerateAllAliases: vi.fn().mockResolvedValue(undefined),
    syncGeneratedArtifacts: vi.fn().mockResolvedValue(undefined),
    syncModelsDirectlyToDatabase: vi.fn().mockResolvedValue(undefined),
  };
  const opts = { dataSource: mockDs, orchestration };
  const ctx = {
    analytics: {
      dataSource: mockDs,
      async checkReadiness() {},
    },
    monitor: {
      monitorDb: {},
    },
  };
  return { app: createApiServer(opts, ctx), dataSource: mockDs, orchestration };
}
