import type { MonitorDb } from "@lite-llm/monitor";
import type { RouteOptions } from "@lite-llm/server-core/types";
import type { Application } from "express";
import { vi } from "vitest";
import type { AppContext } from "../../contexts";
import type { DataSourceOverrides } from "./create-mock-data-source";
import { createMockDataSource } from "./create-mock-data-source";

interface CreateTestServerResult {
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
    syncGeneratedArtifacts: vi.fn().mockResolvedValue(undefined),
    syncModelsDirectlyToDatabase: vi.fn().mockResolvedValue(undefined),
  };
  const opts: RouteOptions = { dataSource: mockDs, orchestration };
  const ctx: AppContext = {
    analytics: {
      dataSource: mockDs,
      async checkReadiness() {},
    },
    monitor: {
      monitorDb: {} as MonitorDb,
    },
  };
  return { app: createApiServer(opts, ctx), dataSource: mockDs, orchestration };
}
