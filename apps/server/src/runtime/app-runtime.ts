import { existsSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createAgentPluginsOrchestrator,
  LitellmAliasPlugin,
  OpenAgentPlugin,
  OpenCodePlugin,
  VsCodePlugin,
} from "@lite-llm/agent-plugins";
import { createAgentsManager } from "@lite-llm/agents-manager";
import { prisma } from "@lite-llm/analytics-service/queries/client";
import {
  createRepositoryClient as createModelsRepositoryClient,
  ModelService,
} from "@lite-llm/models-service";
import { createOrchestrationServices } from "@lite-llm/server/orchestration";
import { createAppContext } from "../contexts";
import { env } from "../env";
import { createApiServer } from "./api-server";
import {
  createHealthCheckRuntime,
  type HealthCheckRuntime,
} from "./health-check-runtime";
import { createMonitorRuntime, type MonitorRuntime } from "./monitor-runtime";
import { createPromptEvalRuntime } from "./prompt-eval-runtime";

interface AppRuntime {
  stop: () => void;
}

const DEFAULT_HEALTH_CHECK_PROMPT =
  "Respond with ONLY your model name. Example: gpt-5.3-codex";

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

function setupAgentPluginsOrchestrator(
  projectRoot: string,
  aliasDbWriter?: {
    updateAliases(aliases: Record<string, string>): Promise<void>;
  },
) {
  const agentsManager = createAgentsManager({
    dbPath: path.join(projectRoot, "@agents", "agents.json"),
  });

  const modelsRepository = createModelsRepositoryClient({
    filePath: path.join(projectRoot, "@models", "models.json"),
  });

  return createAgentPluginsOrchestrator({
    repository: agentsManager.repository,
    modelsRepository,
    services: agentsManager.services,
    outputDir: path.join(projectRoot, "@storage", "output"),
    allPlugins: [
      new OpenCodePlugin(),
      new OpenAgentPlugin(),
      new VsCodePlugin(),
      new LitellmAliasPlugin(aliasDbWriter),
    ],
  });
}

function registerShutdownHooks(stop: () => void): void {
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}

export async function startAppRuntime(): Promise<AppRuntime> {
  const projectRoot = getProjectRoot();
  const ctx = createAppContext();

  const aliasDbWriter = {
    updateAliases: async (aliases: Record<string, string>) => {
      await ctx.analytics.dataSource.updateAgentRoutingConfig(aliases);
    },
  };

  const agentPlugins = setupAgentPluginsOrchestrator(
    projectRoot,
    aliasDbWriter,
  );
  const modelsRepository = createModelsRepositoryClient({
    filePath: path.join(projectRoot, "@models", "models.json"),
  });
  const modelsService = new ModelService({ repository: modelsRepository });
  const orchestration = createOrchestrationServices(
    ctx.analytics.dataSource,
    agentPlugins,
    modelsService,
  );

  const app = createApiServer(
    {
      dataSource: ctx.analytics.dataSource,
      orchestration,
      agentsManager: agentPlugins,
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
    pollIntervalMs: env.HEALTH_CHECK_INTERVAL_MS,
  });

  const enabledModelNames = await modelsService.getEnabledModelNames();
  const healthCheckPrompt =
    (await ctx.analytics.dataSource.getHealthCheckPrompt()) ??
    DEFAULT_HEALTH_CHECK_PROMPT;

  const healthCheckRuntime: HealthCheckRuntime = createHealthCheckRuntime({
    ctx,
    httpServer,
    wsServer: monitorRuntime.wsServer,
    pollIntervalMs: env.HEALTH_CHECK_INTERVAL_MS,
    timeoutMs: env.HEALTH_CHECK_TIMEOUT_MS,
    prompt: healthCheckPrompt,
    maxConcurrency: 6,
    litellmApiUrl: env.LITELLM_API_URL,
    litellmApiKey: env.LITELLM_API_KEY,
    enabledModelNames: [...enabledModelNames],
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
