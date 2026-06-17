import { mkdirSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { createRepositoryClient as createAgentsClient } from "@lite-llm/agents-manager";
import { serverEnv } from "@lite-llm/config/server";
import { createRepositoryClient as createModelsClient } from "@lite-llm/models-repository";
import {
  findRepoRoot,
  resolveSettingsPaths,
} from "../settings-import/paths.js";

function splitAgentsConfig(
  config: Awaited<ReturnType<ReturnType<typeof createAgentsClient>["read"]>>,
) {
  const { plugins, ...agentsPart } = config;
  return { agentsPart, plugins: plugins ?? {} };
}

function printExportHelp(): void {
  console.log(`Usage: pnpm settings:export [options]

Export database settings to @settings/*.jsonc backup files.
Requires SETTINGS_STORAGE=database.

Options:
  --help  Show this help message
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    printExportHelp();
    return;
  }

  if (serverEnv.SETTINGS_STORAGE !== "database") {
    console.warn(
      "SETTINGS_STORAGE is not database; export reads from the active repository backend.",
    );
  }

  const paths = resolveSettingsPaths(serverEnv.SETTINGS_PATH);
  const agentsRepository = createAgentsClient();
  const modelsRepository = createModelsClient();
  const config = await agentsRepository.read();
  const modelsConfig = await modelsRepository.read();
  const { agentsPart, plugins } = splitAgentsConfig(config);

  mkdirSync(path.dirname(paths.agentsFile), { recursive: true });
  mkdirSync(path.dirname(paths.pluginsFile), { recursive: true });
  mkdirSync(path.dirname(paths.modelsFile), { recursive: true });

  writeFileSync(
    paths.agentsFile,
    `${JSON.stringify(agentsPart, null, 2)}\n`,
    "utf-8",
  );
  writeFileSync(
    paths.pluginsFile,
    `${JSON.stringify({ version: 2, plugins }, null, 2)}\n`,
    "utf-8",
  );
  writeFileSync(
    paths.modelsFile,
    `${JSON.stringify(modelsConfig, null, 2)}\n`,
    "utf-8",
  );

  console.log(
    `Exported settings backup to ${findRepoRoot()}/${serverEnv.SETTINGS_PATH}`,
  );
  console.log(`  agents:  ${paths.agentsFile}`);
  console.log(`  plugins: ${paths.pluginsFile}`);
  console.log(`  models:  ${paths.modelsFile}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
