import { existsSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));

export function findRepoRoot(startDir = scriptsDir): string {
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

export interface SettingsPaths {
  repoRoot: string;
  agentsFile: string;
  pluginsFile: string;
  modelsFile: string;
}

function resolveWithJsoncFallback(basePath: string): string {
  if (existsSync(basePath)) {
    return basePath;
  }

  if (basePath.endsWith(".json")) {
    const jsoncPath = `${basePath}c`;
    if (existsSync(jsoncPath)) {
      return jsoncPath;
    }
  }

  if (basePath.endsWith(".jsonc")) {
    const jsonPath = basePath.slice(0, -1);
    if (existsSync(jsonPath)) {
      return jsonPath;
    }
  }

  return basePath;
}

export function resolveSettingsPaths(
  settingsPath = process.env.SETTINGS_PATH ?? "@settings",
): SettingsPaths {
  const repoRoot = findRepoRoot();
  const settingsRoot = settingsPath.startsWith("@settings")
    ? path.join(repoRoot, settingsPath)
    : path.isAbsolute(settingsPath)
      ? settingsPath
      : path.resolve(repoRoot, settingsPath);

  return {
    repoRoot,
    agentsFile: resolveWithJsoncFallback(
      path.join(settingsRoot, "agents", "agents.jsonc"),
    ),
    pluginsFile: resolveWithJsoncFallback(
      path.join(settingsRoot, "plugins", "plugins.jsonc"),
    ),
    modelsFile: resolveWithJsoncFallback(
      path.join(settingsRoot, "models", "models.jsonc"),
    ),
  };
}
