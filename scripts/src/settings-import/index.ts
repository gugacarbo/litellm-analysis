import { existsSync } from "node:fs";
import {
  getModelProxyPrisma,
  type PrismaClient,
} from "@lite-llm/model-proxy-repository";
import { importAgentsFromFile } from "./import-agents.js";
import { runImportJob } from "./import-job.js";
import { importModelsFromFile } from "./import-models.js";
import { importPluginsFromFile } from "./import-plugins.js";
import { resolveSettingsPaths } from "./paths.js";
import {
  createEmptySummary,
  type ImportSummary,
  parseImportFlags,
  printImportHelp,
} from "./types.js";

async function runImport(
  prisma: PrismaClient,
  flags: ReturnType<typeof parseImportFlags>,
): Promise<ImportSummary> {
  const paths = resolveSettingsPaths();
  const summary = createEmptySummary();

  for (const [label, filePath] of [
    ["agents", paths.agentsFile],
    ["plugins", paths.pluginsFile],
    ["models", paths.modelsFile],
  ] as const) {
    if (!existsSync(filePath)) {
      throw new Error(`Missing ${label} file: ${filePath}`);
    }
  }

  console.log(
    `Importing from ${paths.repoRoot}/${process.env.SETTINGS_PATH ?? "@settings"}`,
  );

  const agents = await importAgentsFromFile(
    prisma,
    paths.agentsFile,
    flags,
    summary,
  );

  await importPluginsFromFile(prisma, paths.pluginsFile, flags, summary);

  await importModelsFromFile(
    prisma,
    paths.modelsFile,
    {
      agents: agents.agents ?? {},
      categories: agents.categories ?? {},
      globalFallbackModel: agents.globalFallbackModel,
    },
    flags,
    summary,
  );

  return summary;
}

function printSummary(summary: ImportSummary, dryRun: boolean): void {
  console.log("\n--- Import summary ---");
  console.log(JSON.stringify(summary, null, 2));

  if (summary.requiredEnvVars.length > 0) {
    console.log("\nRequired env vars:");
    for (const entry of summary.requiredEnvVars) {
      console.log(`  ${entry.secretRef} (${entry.provider})`);
    }
  }

  if (summary.warnings.length > 0) {
    console.log(`\nWarnings (${summary.warnings.length}):`);
    for (const warning of summary.warnings) {
      console.log(`  - ${warning}`);
    }
  }

  if (dryRun) {
    console.log("\nDry run complete — no database writes were made.");
  } else {
    console.log(
      "\nImport complete. Restart the server for changes to take effect.",
    );
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    printImportHelp();
    return;
  }

  const flags = parseImportFlags(args);
  const prisma = getModelProxyPrisma();

  try {
    const summary = await runImportJob(prisma, "@settings", async () =>
      runImport(prisma, flags),
    );

    printSummary(summary, flags.dryRun);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
