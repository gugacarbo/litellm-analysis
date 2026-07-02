import { existsSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { createAgentPluginsOrchestrator } from "@lite-llm/agent-plugins";
import { createAgentsManager } from "@lite-llm/agents-manager";
import { disconnectDb } from "@lite-llm/database/client";
import {
  createRegistryServices,
  getHealthCheckPrompt,
} from "@lite-llm/model-proxy-config-service";
import { createHeboModelProxyGateway } from "@lite-llm/llm-gateway/hebo";
import {
  createRepositoryClient as createModelsRepositoryClient,
  ModelService,
  ProviderService,
} from "@lite-llm/models-service";
import { createOrchestrationServices } from "@lite-llm/server/orchestration";
import { updateRouterAliasesInRegistry } from "@lite-llm/server/orchestration/router-settings";
import { createAppContext } from "../contexts";
import { env } from "../env";
import {
  createSpendLogsWatcher,
  type SpendLogsWatcher,
} from "../ws/spend-logs-watcher";
import { WebSocketServer } from "../ws/websocket-server";
import { createApiServer } from "./api-server";
import {
  createHealthCheckRuntime,
  type HealthCheckRuntime,
} from "./health-check-runtime";

interface AppRuntime {
  stop: () => void;
}

const DEFAULT_HEALTH_CHECK_PROMPT =
  "Respond with ONLY your model name. Example: gpt-5.3-codex";
const CHATGPT_SUBSCRIPTION_PROVIDER = "chatgpt-subscription";

interface HealthCheckPromptSource {
  getHealthCheckPrompt(): Promise<string | null>;
}

async function seedBootstrapApiKey(
  envKey: string | undefined,
  registry: ReturnType<typeof createRegistryServices>,
): Promise<void> {
  const trimmed = envKey?.trim();
  if (!trimmed) {
    return;
  }

  const existing = await registry.apiKeysService.list();
  if (existing.length > 0) {
    return;
  }

  await registry.apiKeysService.create(
    { label: "env-bootstrap", enabled: true },
    trimmed,
  );
}

function getProjectRoot(): string {
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
  const agentsManager = createAgentsManager();

  const modelsRepository = createModelsRepositoryClient();

  return createAgentPluginsOrchestrator({
    repository: agentsManager.repository,
    modelsRepository,
    services: agentsManager.services,
    outputDir: path.join(projectRoot, env.STORAGE_PATH, "output"),
    aliasDbWriter,
  });
}

function registerShutdownHooks(stop: () => void): void {
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}

export async function resolveHealthCheckPrompt(
  settingsService: ReturnType<typeof createRegistryServices>["settingsService"],
  _dataSource?: HealthCheckPromptSource,
): Promise<string> {
  try {
    const fromRegistry = await getHealthCheckPrompt(settingsService);
    if (fromRegistry) {
      return fromRegistry;
    }

    return DEFAULT_HEALTH_CHECK_PROMPT;
  } catch (error) {
    console.warn(
      "Failed to load health check prompt from database; using default prompt.",
      error,
    );
    return DEFAULT_HEALTH_CHECK_PROMPT;
  }
}

export async function startAppRuntime(): Promise<AppRuntime> {
  const projectRoot = getProjectRoot();
  const ctx = createAppContext();
  const registry = createRegistryServices();
  await seedBootstrapApiKey(env.MODEL_PROXY_API_KEY, registry);

  const aliasDbWriter = {
    updateAliases: async (aliases: Record<string, string>) => {
      await updateRouterAliasesInRegistry(registry.settingsService, aliases);
    },
  };

  const agentPlugins = await setupAgentPluginsOrchestrator(
    projectRoot,
    aliasDbWriter,
  );
  const modelsRepository = createModelsRepositoryClient();
  const modelsService = new ModelService({ repository: modelsRepository });
  const providerService = new ProviderService({
    repository: modelsRepository,
  });
  const heboGateway = await createHeboModelProxyGateway({
    modelsService,
    providerService,
    openAiOAuthService: registry.openAiOAuthService,
  });
  const orchestration = createOrchestrationServices(
    ctx.analytics.dataSource,
    agentPlugins,
    modelsService,
    {
      registryModelsService: registry.registryModelsService,
      settingsService: registry.settingsService,
    },
  );

  const app = createApiServer(
    {
      dataSource: ctx.analytics.dataSource,
      orchestration,
      agentsManager: agentPlugins,
      heboGateway,
      modelsService,
      providerService,
      registry: {
        settingsService: registry.settingsService,
        registryModelsService: registry.registryModelsService,
        providersService: registry.providersService,
        apiKeysService: registry.apiKeysService,
        openAiOAuthService: registry.openAiOAuthService,
      },
    },
    ctx,
  );

  const port = env.PORT;

  const httpServer = app.listen(port, () => {
    console.log(`API server running on http://localhost:${port}`);
    console.log(`Config files location: ${path.join(projectRoot, "data")}`);
  });

  const wsServer = new WebSocketServer(httpServer);
  wsServer.start();

  heboGateway.onRequestFinished((requestId) => {
    wsServer.broadcast({
      type: "spend_logs_changed",
      data: {
        changedRequestIds: [requestId],
        timestamp: Date.now(),
      },
    });
  });

  const enabledModelNames = await modelsService.getEnabledModelNames();
  const allProviders = await providerService.getAll();
  const allModels = await modelsService.getAll();
  const requestModeByModelName: Record<string, "chat" | "responses"> = {};
  for (const modelName of enabledModelNames) {
    const route = await registry.registryModelsService.getRoute(modelName);
    const modelSpec = allModels[modelName];
    const providerKeys = [
      route?.ownedBy,
      route?.family,
      modelSpec?.ownedBy,
      modelSpec?.family,
    ].filter((value): value is string => !!value?.trim());

    const usesChatGptSubscription = providerKeys.some((key) => {
      if (key === CHATGPT_SUBSCRIPTION_PROVIDER) {
        return true;
      }
      const provider = allProviders[key];
      return provider?.ownedBy === CHATGPT_SUBSCRIPTION_PROVIDER;
    });

    if (usesChatGptSubscription) {
      requestModeByModelName[modelName] = "responses";
    }
  }
  const healthCheckPrompt = await resolveHealthCheckPrompt(
    registry.settingsService,
    ctx.analytics.dataSource,
  );

  const healthCheckRuntime: HealthCheckRuntime = createHealthCheckRuntime({
    ctx,
    httpServer,
    wsServer,
    timeoutMs: 30_000,
    prompt: healthCheckPrompt,
    maxConcurrency: 6,
    modelProxyBaseUrl: env.MODEL_PROXY_BASE_URL?.trim() || "",
    modelProxyApiKey: env.MODEL_PROXY_API_KEY?.trim() || "",
    enabledModelNames: [...enabledModelNames],
    requestModeByModelName,
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

  const spendLogsWatcher: SpendLogsWatcher = createSpendLogsWatcher({
    analyticsDataSource: ctx.analytics.dataSource,
    wsServer,
  });

  healthCheckRuntime.start();
  spendLogsWatcher.start();

  const stop = () => {
    console.log("\nShutting down gracefully...");
    spendLogsWatcher.stop();
    healthCheckRuntime.stop();
    wsServer.stop();
    httpServer.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
  };

  registerShutdownHooks(stop);

  return { stop };
}
