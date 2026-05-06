import type { RouteOptions } from "@lite-llm/server-core/types";
import type { Application } from "express";
import { vi } from "vitest";
import type { DataSourceOverrides } from "./create-mock-data-source";
import { createMockDataSource } from "./create-mock-data-source";

export interface CreateTestServerResult {
  app: Application;
  dataSource: ReturnType<typeof createMockDataSource>;
  orchestration: RouteOptions["orchestration"];
}

export async function createTestServer(
  overrides: DataSourceOverrides = {},
): Promise<CreateTestServerResult> {
  const { createApiServer } = await import("../../runtime/api-server");
  const mockDs = createMockDataSource(overrides);
  const orchestration = {
    dataSource: mockDs,
    buildAliasMap: vi.fn().mockResolvedValue({}),
    regenerateAllAliases: vi.fn().mockResolvedValue(undefined),
    syncGeneratedArtifacts: vi.fn().mockResolvedValue(undefined),
    syncModelsDirectlyToDatabase: vi.fn().mockResolvedValue(undefined),
  };
  const opts: RouteOptions = { dataSource: mockDs, orchestration };
  return { app: createApiServer(opts), dataSource: mockDs, orchestration };
}
