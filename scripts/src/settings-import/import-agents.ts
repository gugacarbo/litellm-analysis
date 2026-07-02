import {
  SETTING_KEYS,
  SettingsRepository,
} from "@lite-llm/model-proxy-registry-service";
import {
  type Prisma,
  type PrismaClient,
} from "@lite-llm/model-proxy-repository";
import { readAgentsFile } from "./parse.js";
import type { ImportFlags, ImportSummary } from "./types.js";

export async function importAgentsFromFile(
  prisma: PrismaClient,
  filePath: string,
  flags: ImportFlags,
  summary: ImportSummary,
): Promise<ReturnType<typeof readAgentsFile>> {
  const agents = readAgentsFile(filePath);
  const settings = new SettingsRepository(prisma);
  const existing = await settings.findByKey(SETTING_KEYS.DASHBOARD_AGENTS);

  if (existing && !flags.force) {
    summary.agents.skipped += 1;
    console.log(`[agents] skipped (already exists; use --force to overwrite)`);
    return agents;
  }

  if (flags.dryRun) {
    console.log(
      `[agents] dry-run would ${existing ? "update" : "insert"} dashboard.agents from ${filePath}`,
    );
    if (existing) {
      summary.agents.updated += 1;
    } else {
      summary.agents.inserted += 1;
    }
    return agents;
  }

  await settings.upsert(
    SETTING_KEYS.DASHBOARD_AGENTS,
    agents as Prisma.InputJsonValue,
  );
  if (existing) {
    summary.agents.updated += 1;
    console.log(`[agents] updated dashboard.agents from ${filePath}`);
  } else {
    summary.agents.inserted += 1;
    console.log(`[agents] inserted dashboard.agents from ${filePath}`);
  }

  return agents;
}
