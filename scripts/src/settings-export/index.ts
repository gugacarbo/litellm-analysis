import { mkdirSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { createRepositoryClient as createAgentsClient } from "@lite-llm/agents-manager";
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

  const paths = resolveSettingsPaths();
  const agentsRepository = createAgentsClient();
  const config = await agentsRepository.read();
  const { agentsPart, plugins } = splitAgentsConfig(config);

  mkdirSync(path.dirname(paths.agentsFile), { recursive: true });
  mkdirSync(path.dirname(paths.pluginsFile), { recursive: true });

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

  const settingsPath = process.env.SETTINGS_PATH ?? "@settings";
  console.log(`Exported settings backup to ${findRepoRoot()}/${settingsPath}`);
  console.log(`  agents:  ${paths.agentsFile}`);
  console.log(`  plugins: ${paths.pluginsFile}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
