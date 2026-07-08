import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  NormalizedModelBenchmark,
  StoredModelBenchmarkDataset,
} from "@lite-llm/contracts/benchmarks";

// @knipignore
export function findWorkspaceRoot(startDir: string): string {
  let current = startDir;
  const root = path.parse(current).root;

  while (current !== root) {
    const marker = path.join(current, "pnpm-workspace.yaml");
    if (existsSync(marker)) return current;
    current = path.dirname(current);
  }

  return startDir;
}

export function getWorkspaceRoot(): string {
  const runtimeDir = path.dirname(fileURLToPath(import.meta.url));
  return findWorkspaceRoot(runtimeDir);
}

export function resolveStoragePath(
  workspaceRoot: string,
  storagePath: string,
): string {
  if (path.isAbsolute(storagePath)) {
    return storagePath;
  }
  return path.join(workspaceRoot, storagePath);
}

export function toCompactKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function toMatchKeys(value: string): string[] {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return [];

  const lastSegment = trimmed.includes("/")
    ? (trimmed.split("/").at(-1) ?? trimmed)
    : trimmed;
  const compact = trimmed.replace(/[^a-z0-9]/g, "");
  const compactSegment = lastSegment.replace(/[^a-z0-9]/g, "");

  return Array.from(new Set([trimmed, lastSegment, compact, compactSegment]));
}

interface ModelAliasesFile {
  aliases: Record<string, string>;
}

export async function loadModelAliases(
  storagePath: string,
): Promise<Record<string, string>> {
  const aliasesPath = path.join(
    storagePath,
    "benchmarks",
    "model-aliases.json",
  );
  try {
    const raw = await readFile(aliasesPath, "utf8");
    const parsed = JSON.parse(raw) as ModelAliasesFile;
    return parsed.aliases ?? {};
  } catch {
    return {};
  }
}

export async function loadBenchmarkDataset(
  filePath: string,
): Promise<StoredModelBenchmarkDataset> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as StoredModelBenchmarkDataset;
}

export function findBenchmarkModel(
  modelName: string,
  models: NormalizedModelBenchmark[],
  aliases: Record<string, string>,
): NormalizedModelBenchmark | null {
  const resolvedName = aliases[modelName] ?? modelName;
  const candidateKeys = toMatchKeys(resolvedName);

  const matches = models.filter((m) => {
    const modelKeys = [
      ...toMatchKeys(m.name),
      ...(m.slug ? toMatchKeys(m.slug) : []),
    ];
    return candidateKeys.some((key) => modelKeys.includes(key));
  });

  if (matches.length === 0) {
    const resolvedCompact = toCompactKey(resolvedName);
    const suffixMatches = models.filter((m) => {
      if (!m.slug) return false;
      const slugCompact = toCompactKey(m.slug);
      if (slugCompact.length <= resolvedCompact.length) return false;
      if (!slugCompact.startsWith(resolvedCompact)) return false;
      const remainder = slugCompact.slice(resolvedCompact.length);
      return /^[a-z]+$/.test(remainder);
    });
    if (suffixMatches.length === 1) return suffixMatches[0];
    return null;
  }

  if (matches.length === 1) return matches[0];

  const creatorMatch = matches.find(
    (m) => m.creatorName.toLowerCase() === resolvedName.toLowerCase(),
  );
  if (creatorMatch) return creatorMatch;

  return matches[0];
}
