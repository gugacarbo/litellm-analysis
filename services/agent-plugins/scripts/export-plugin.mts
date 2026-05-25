import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRepository } from "@lite-llm/agents-repository/repository";
import { createRepositoryClient as createModelsRepositoryClient } from "@lite-llm/models-repository";
import {
  createAgentPluginsOrchestrator,
  LitellmAliasPlugin,
  OpenAgentPlugin,
  OpenCodePlugin,
  VsCodePlugin,
  WeavePlugin,
} from "../src/index.ts";

const pluginId = process.argv[2];
if (!pluginId) {
  console.error("Usage: tsx scripts/export-plugin.mts <pluginId>");
  process.exit(1);
}

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const agentsPath = path.join(root, "@settings/agents/agents.jsonc");
const pluginsPath = path.join(root, "@settings/plugins/plugins.jsonc");

async function main() {
  const repository = createRepository({
    filePath: agentsPath,
    pluginsFilePath: pluginsPath,
    validateOnRead: false,
  });

  const orchestrator = await createAgentPluginsOrchestrator({
    repository,
    modelsRepository: createModelsRepositoryClient(),
    services: {
      agents: {
        getAll: async () => repository.read().then((c) => c.agents ?? {}),
      },
      catalog: {
        getAll: async () => repository.read().then((c) => c.agents ?? {}),
        get: async (key: string) =>
          repository.read().then((c) => c.agents?.[key]),
        create: async () => {},
        update: async () => {},
        delete: async () => {},
      },
      categories: {
        getAll: async () => repository.read().then((c) => c.categories ?? {}),
        get: async (key: string) =>
          repository.read().then((c) => c.categories?.[key]),
        create: async () => {},
        update: async () => {},
        delete: async () => {},
      },
      routing: {
        getPluginConfig: async (id: string) =>
          repository.read().then((c) => c.plugins?.[id]),
        getAgentMappings: async (id: string) =>
          repository.read().then((c) => c.plugins?.[id]?.routing?.agents ?? {}),
        getCategoryMappings: async (id: string) =>
          repository
            .read()
            .then((c) => c.plugins?.[id]?.routing?.categories ?? {}),
        toggleAgentPlugin: async () => false,
        toggleCategoryMapping: async () => false,
        savePluginConfig: async () => {},
      },
    },
    outputDir: path.join(root, "@storage/output"),
    allPlugins: [
      new OpenCodePlugin(),
      new OpenAgentPlugin(),
      new VsCodePlugin(),
      new LitellmAliasPlugin(),
      new WeavePlugin(),
    ],
  });

  await orchestrator.registry.exportOne(pluginId);
  console.log(`Exported ${pluginId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
