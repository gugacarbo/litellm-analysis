import {
  createRegistryServices,
  SETTING_KEYS,
  SettingsRepository,
} from "@lite-llm/model-proxy-registry-service";
import type { PrismaClient } from "@lite-llm/model-proxy-repository";
import { updateRouterAliasesInRegistry } from "@lite-llm/server/orchestration/router-settings";
import { readPluginsFile } from "./parse.js";
import type { ImportFlags, ImportSummary } from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractModelGroupAlias(
  plugins: Record<string, unknown>,
): Record<string, string> {
  const modelAlias = plugins["model-alias"];
  if (!isRecord(modelAlias)) {
    return {};
  }

  const config = modelAlias.config;
  if (!isRecord(config)) {
    return {};
  }

  const aliases = config.model_group_alias;
  if (!isRecord(aliases)) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const [alias, target] of Object.entries(aliases)) {
    if (typeof target === "string" && target.trim()) {
      result[alias] = target.trim();
    }
  }
  return result;
}

export async function importPluginsFromFile(
  prisma: PrismaClient,
  filePath: string,
  flags: ImportFlags,
  summary: ImportSummary,
): Promise<ReturnType<typeof readPluginsFile>> {
  const plugins = readPluginsFile(filePath);
  const settings = new SettingsRepository(prisma);
  const existing = await settings.findByKey(SETTING_KEYS.DASHBOARD_PLUGINS);

  if (existing && !flags.force) {
    summary.plugins.skipped += 1;
    console.log(`[plugins] skipped (already exists; use --force to overwrite)`);
  } else if (flags.dryRun) {
    console.log(
      `[plugins] dry-run would ${existing ? "update" : "insert"} dashboard.plugins from ${filePath}`,
    );
    if (existing) {
      summary.plugins.updated += 1;
    } else {
      summary.plugins.inserted += 1;
    }
  } else {
    await settings.upsert(SETTING_KEYS.DASHBOARD_PLUGINS, plugins);
    if (existing) {
      summary.plugins.updated += 1;
      console.log(`[plugins] updated dashboard.plugins from ${filePath}`);
    } else {
      summary.plugins.inserted += 1;
      console.log(`[plugins] inserted dashboard.plugins from ${filePath}`);
    }
  }

  const aliases = extractModelGroupAlias(plugins);
  if (Object.keys(aliases).length === 0) {
    console.log("[plugins] no model_group_alias entries to sync");
    return plugins;
  }

  if (flags.dryRun) {
    console.log(
      `[plugins] dry-run would sync ${Object.keys(aliases).length} router aliases`,
    );
    return plugins;
  }

  const registry = createRegistryServices({ prisma });
  await updateRouterAliasesInRegistry(registry.settingsService, aliases);
  console.log(
    `[plugins] synced ${Object.keys(aliases).length} aliases to router_settings`,
  );

  return plugins;
}
