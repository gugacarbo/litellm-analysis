#!/usr/bin/env node

/**
 * check-barrel-exports.ts
 *
 * Verifica barrel exports (arquivos que só re-exportam de outros módulos)
 * que NÃO são o entry point oficial de um package.
 *
 * Regra:
 *   Barrel exports SÓ são permitidos quando o arquivo é o target do campo
 *   "exports" no package.json do próprio diretório (ou ancestral imediato).
 *   Em apps (apps/*) e em subdiretórios internos de packages, barrel exports
 *   são proibidos — prefira imports diretos.
 *
 * Uso:
 *   node --experimental-strip-types scripts/code-checks/check-barrel-exports.ts
 *   node --experimental-strip-types scripts/code-checks/check-barrel-exports.ts --fix
 */

import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";

// ── Config ────────────────────────────────────────────────────────────────

const repoRoot = process.cwd();

const workspaceRoots = [
  "apps",
  "services",
  "packages",
  "repositories",
  "database",
] as const;

const sourceExtensions = new Set([
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);

const ignoredDirEntries = new Set([
  "node_modules",
  "dist",
  "build",
  ".turbo",
  ".git",
  "coverage",
]);

const ignoredPathPrefixes = [path.join(repoRoot, "apps", "server")];

// ── Helpers ────────────────────────────────────────────────────────────────

function walk(dir: string, visitor: (filePath: string) => void) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirEntries.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (
      ignoredPathPrefixes.some(
        (prefix) =>
          fullPath === prefix || fullPath.startsWith(`${prefix}${path.sep}`),
      )
    ) {
      continue;
    }
    if (entry.isDirectory()) {
      walk(fullPath, visitor);
      continue;
    }
    visitor(fullPath);
  }
}

function toPosix(filePath: string) {
  return filePath.split(path.sep).join("/");
}

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// ── Package index ─────────────────────────────────────────────────────────

type PackageInfo = {
  /** Absolute path to the package directory */
  dir: string;
  /** Package name from package.json */
  name: string;
  /** Set of resolved absolute file paths that are export targets */
  exportTargets: Set<string>;
};

function collectExportTargets(
  exportsField: unknown,
  pkgDir: string,
  collector: Set<string>,
): void {
  if (typeof exportsField === "string") {
    const resolved = path.resolve(pkgDir, exportsField);
    if (fs.existsSync(resolved)) collector.add(resolved);
    return;
  }

  if (Array.isArray(exportsField)) {
    for (const value of exportsField) {
      collectExportTargets(value, pkgDir, collector);
    }
    return;
  }

  if (!exportsField || typeof exportsField !== "object") return;

  for (const value of Object.values(exportsField)) {
    collectExportTargets(value, pkgDir, collector);
  }
}

function buildPackageIndex(): PackageInfo[] {
  const packages: PackageInfo[] = [];

  for (const root of workspaceRoots) {
    const fullRoot = path.join(repoRoot, root);
    if (!fs.existsSync(fullRoot)) continue;

    walk(fullRoot, (filePath) => {
      if (path.basename(filePath) !== "package.json") return;

      const pkg = readJson(filePath);
      const pkgDir = path.dirname(filePath);
      const name = typeof pkg.name === "string" ? pkg.name : "";

      if (!name) return;

      const exportTargets = new Set<string>();

      if (pkg.exports != null) {
        collectExportTargets(pkg.exports, pkgDir, exportTargets);
      }

      packages.push({ dir: pkgDir, name, exportTargets });
    });
  }

  return packages;
}

function findPackageForFile(
  filePath: string,
  packages: PackageInfo[],
): PackageInfo | null {
  // Find the nearest package that contains this file
  let best: PackageInfo | null = null;
  let bestLen = 0;

  for (const pkg of packages) {
    const rel = path.relative(pkg.dir, filePath);
    if (rel && !rel.startsWith("..") && !path.isAbsolute(rel)) {
      if (pkg.dir.length > bestLen) {
        best = pkg;
        bestLen = pkg.dir.length;
      }
    }
  }

  return best;
}

// ── Barrel detection ───────────────────────────────────────────────────────

/**
 * Checks if a file is a "barrel export" — a file that ONLY re-exports
 * symbols from other modules, with no local code of its own.
 *
 * A file is considered a barrel if every top-level statement is either:
 *   - `export * from "..."` (wildcard re-export)
 *   - `export { ... } from "..."` (named re-export)
 *   - `export type { ... } from "..."` (type re-export)
 *   - `import "..."` (side-effect import — allowed in barrels)
 *
 * Local code (imports used locally, function/class/variable definitions,
 * type aliases defined locally, etc.) disqualifies the file as a barrel.
 */
function isBarrelExport(filePath: string): boolean {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  // Regexes for barrel-only statements
  const reExportWildcard = /^\s*export\s+\*\s+from\s+/;
  const reExportNamed = /^\s*export\s+(type\s+)?\{\s*[^}]+\s*\}\s+from\s+/;
  const reSideEffectImport = /^\s*import\s+["']/;
  const reBlankOrComment = /^\s*($|\/\/|\/\*)/;

  let hasReExport = false;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (reBlankOrComment.test(line)) continue;

    if (reExportWildcard.test(line)) {
      hasReExport = true;
      continue;
    }

    if (reExportNamed.test(line)) {
      hasReExport = true;
      continue;
    }

    if (reSideEffectImport.test(line)) {
      continue;
    }

    // If we find any other statement, it's not a pure barrel
    return false;
  }

  return hasReExport;
}

// ── Main ───────────────────────────────────────────────────────────────────

function main() {
  const packages = buildPackageIndex();
  const violations: { file: string; pkg: PackageInfo | null }[] = [];

  // Build a set of all export target paths for quick lookup
  const exportTargets = new Set<string>();
  for (const pkg of packages) {
    for (const target of pkg.exportTargets) {
      exportTargets.add(target);
    }
  }

  // Scan all source files named "index" (barrel convention)
  for (const root of workspaceRoots) {
    const fullRoot = path.join(repoRoot, root);
    if (!fs.existsSync(fullRoot)) continue;

    walk(fullRoot, (filePath) => {
      if (!sourceExtensions.has(path.extname(filePath))) return;

      const basename = path.basename(filePath);
      // Only check files that could be barrels: index.ts, index.tsx, etc.
      if (basename !== "index.ts" && basename !== "index.tsx") return;

      // Skip if this file is an official export target
      if (exportTargets.has(filePath)) return;

      // Check if it's a barrel
      if (!isBarrelExport(filePath)) return;

      const pkg = findPackageForFile(filePath, packages);
      violations.push({ file: filePath, pkg });
    });
  }

  if (!violations.length) {
    console.log(chalk.green("✓ Nenhum barrel export irregular encontrado."));
    process.exit(0);
  }

  console.log(
    chalk.red.bold(
      `\n✗ ${violations.length} barrel export(s) encontrado(s) fora de package exports:\n`,
    ),
  );

  for (const v of violations) {
    const rel = toPosix(path.relative(repoRoot, v.file));
    const context = v.pkg
      ? `dentro de ${chalk.cyan(v.pkg.name)}`
      : chalk.gray("(fora de qualquer package)");
    console.log(`  ${chalk.yellow(rel)}  ${context}`);
  }

  console.log(
    chalk.yellow(
      "\n  Barrel exports só são permitidos como entry point oficial de packages\n" +
        '  (arquivo apontado pelo campo "exports" no package.json).\n' +
        "  Prefira imports diretos para os módulos de origem.\n",
    ),
  );

  process.exitCode = 1;
}

main();
