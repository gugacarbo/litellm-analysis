import { existsSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { createAgentsManager } from "@lite-llm/agents-manager";
import {
  createRepositoryClient as createModelsRepositoryClient,
  ModelService,
} from "@lite-llm/models-manager";
import { prisma } from "@lite-llm/analytics/queries/client";
import { createOrchestrationServices } from "@lite-llm/server-core/orchestration";
import { AliasDbWriterImpl } from "@lite-llm/server-core/orchestration/alias-db-writer.js";
import { createAppContext } from "../contexts";
import { env } from "../env";
import { createApiServer } from "./api-server";
import {
  createHealthCheckRuntime,
  type HealthCheckRuntime,
} from "./health-check-runtime";
import { createMonitorRuntime, type MonitorRuntime } from "./monitor-runtime";
import { createPromptEvalRuntime } from "./prompt-eval-runtime.js";

interface AppRuntime {
  stop: () => void;
}

function getProjectRoot(): string {
  // Resolve workspace root by walking up to the pnpm workspace marker.
  const serverRuntimeDir = path.dirname(fileURLToPath(import.meta.url));
  return findWorkspaceRoot(serverRuntimeDir);
}

function findWorkspaceRoot(startDir: string): string {
  let dir = startDir;
  const root = path.parse(dir).root;

  while (dir !== root) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }

    dir = path.dirname(dir);
  }

  return startDir;
}

function setupAgentsManager(
  projectRoot: string,
  aliasDbWriter?: import("@lite-llm/agents-manager").AliasDbWriter,
) {
  return createAgentsManager({
    dbPath: path.join(projectRoot, "@agents", "agents.json"),
    outputDir: path.join(projectRoot, "data"),
    aliasDbWriter,
  });
}

function registerShutdownHooks(stop: () => void): void {
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}

export function startAppRuntime(): AppRuntime {
  const projectRoot = getProjectRoot();
  const ctx = createAppContext();
  const aliasDbWriter = new AliasDbWriterImpl(ctx.analytics.dataSource);
  const agentsManager = setupAgentsManager(projectRoot, aliasDbWriter);
  const modelsRepository = createModelsRepositoryClient({
    filePath: path.join(projectRoot, "@models", "models.json"),
  });
  const modelsService = new ModelService({ repository: modelsRepository });
  const orchestration = createOrchestrationServices(
    ctx.analytics.dataSource,
    agentsManager,
    modelsService,
  );

  const app = createApiServer(
    {
      dataSource: ctx.analytics.dataSource,
      orchestration,
      agentsManager,
      modelsService,
    },
    ctx,
  );

  const port = env.PORT;

  const httpServer = app.listen(port, () => {
    console.log(`API server running on http://localhost:${port}`);
    console.log(`Config files location: ${path.join(projectRoot, "data")}`);
  });

  const monitorRuntime: MonitorRuntime = createMonitorRuntime({
    ctx,
    httpServer,
    pollIntervalMs: env.MONITOR_POLL_INTERVAL_MS,
  });

  const healthCheckRuntime: HealthCheckRuntime = createHealthCheckRuntime({
    ctx,
    httpServer,
    wsServer: monitorRuntime.wsServer,
    pollIntervalMs: env.HEALTH_CHECK_INTERVAL_MS,
    timeoutMs: env.HEALTH_CHECK_TIMEOUT_MS,
    prompt: env.HEALTH_CHECK_PROMPT,
    maxConcurrency: 6,
    litellmApiUrl: env.LITELLM_API_URL,
    litellmApiKey: env.LITELLM_API_KEY,
  });

  app.post("/health-check/run", async (req, res) => {
    try {
      const { models } = (req.body as { models?: string[] }) ?? {};
      const modelList = models?.length ? models : undefined;
      await healthCheckRuntime.healthCheckService.runAllChecks(modelList);
      res.json({ triggered: true });
    } catch (_err) {
      res.status(500).json({ error: "Failed to trigger health check" });
    }
  });

  const promptEvalRuntime = createPromptEvalRuntime({
    wsServer: monitorRuntime.wsServer,
    projectRoot,
    categories: [],
  });
  app.use("/prompt-evals/runs", promptEvalRuntime.router);
  app.use("/prompt-evals", promptEvalRuntime.router);

  monitorRuntime.start();
  healthCheckRuntime.start();

  const stop = () => {
    console.log("\nShutting down gracefully...");
    healthCheckRuntime.stop();
    monitorRuntime.stop();
    httpServer.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  registerShutdownHooks(stop);

  return { stop };
}
