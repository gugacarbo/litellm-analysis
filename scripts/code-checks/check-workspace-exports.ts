import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import ts from "typescript";

const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.replace("--limit=", "")) : 2;

if (Number.isNaN(limit) || limit < 0) {
  console.error(chalk.red(`Invalid --limit value: ${limitArg}`));
  process.exit(1);
}

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

// Directory entry names that should stop recursion during file walks.
const ignoredDirEntries = new Set([
  "node_modules",
  "dist",
  "build",
  ".turbo",
  ".git",
  "coverage",
]);

const ignoredPathGlobs = ["database/src/schema/**"];

type ExportMode = "all" | "named";

type SpecifierUsage = {
  all: boolean;
  names: Set<string>;
};

type Workspace = {
  name: string;
  dir: string;
  hasExports: boolean;
  exportEntries: ExportEntry[];
};

type ExportEntry = {
  specifier: string;
  subpath: string;
  files: string[];
};

type Finding = {
  workspace: string;
  specifier: string;
  files: string[];
  unusedExports: string[];
};

function walk(dir: string, visitor: (filePath: string) => void) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirEntries.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!isPathIgnored(fullPath)) {
        walk(fullPath, visitor);
      }
      continue;
    }
    visitor(fullPath);
  }
}

function globToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "GLOBSTAR")
    .replace(/\*/g, "[^/]+")
    .replace(/GLOBSTAR/g, ".*");
  return new RegExp(`^(?:${escaped})$`);
}

function isPathIgnored(filePath: string): boolean {
  const posixPath = toPosix(path.relative(repoRoot, filePath));
  if (posixPath === "") return false;

  const parts = posixPath.split("/");
  if (parts.some((part) => ignoredDirEntries.has(part))) return true;

  const fullPathWithDir = posixPath.endsWith("/")
    ? posixPath.slice(0, -1)
    : `${posixPath}/**`;

  return ignoredPathGlobs.some((glob) => {
    const regex = globToRegex(glob);
    return regex.test(posixPath) || regex.test(fullPathWithDir);
  });
}

function toPosix(filePath: string) {
  return filePath.split(path.sep).join("/");
}

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function listWorkspacePackageJsons(): string[] {
  const manifests: string[] = [];
  for (const root of workspaceRoots) {
    const fullRoot = path.join(repoRoot, root);
    if (!fs.existsSync(fullRoot)) continue;
    walk(fullRoot, (filePath) => {
      if (path.basename(filePath) === "package.json") manifests.push(filePath);
    });
  }
  return manifests;
}

function collectExportTargets(
  exportsField: unknown,
  subpath = ".",
  collector = new Map<string, string[]>(),
): Map<string, string[]> {
  if (typeof exportsField === "string") {
    const list = collector.get(subpath) ?? [];
    list.push(exportsField);
    collector.set(subpath, list);
    return collector;
  }

  if (Array.isArray(exportsField)) {
    for (const value of exportsField) {
      collectExportTargets(value, subpath, collector);
    }
    return collector;
  }

  if (!exportsField || typeof exportsField !== "object") return collector;

  const keys = Object.keys(exportsField);
  const looksLikeSubpathMap = keys.some(
    (key) => key === "." || key.startsWith("./"),
  );

  if (looksLikeSubpathMap) {
    for (const [key, value] of Object.entries(exportsField)) {
      collectExportTargets(value, key, collector);
    }
    return collector;
  }

  for (const value of Object.values(exportsField)) {
    collectExportTargets(value, subpath, collector);
  }
  return collector;
}

function buildWorkspaces(): Workspace[] {
  return listWorkspacePackageJsons()
    .map((manifestPath) => {
      const pkg = readJson(manifestPath);
      const dir = path.dirname(manifestPath);
      const exportTargets = collectExportTargets(pkg.exports ?? {});
      const exportEntries: ExportEntry[] = [];

      for (const [subpath, targets] of exportTargets) {
        const resolvedTargets = [...new Set(targets)]
          .filter((target): target is string => typeof target === "string")
          .filter((target) => !target.includes("*"))
          .map((target) => path.resolve(dir, target))
          .filter((target) => sourceExtensions.has(path.extname(target)))
          .filter((target) => fs.existsSync(target));

        if (!resolvedTargets.length) continue;

        const filteredTargets = resolvedTargets.filter(
          (target) => !isPathIgnored(target),
        );
        if (!filteredTargets.length) continue;

        const name = typeof pkg.name === "string" ? pkg.name : "";
        const specifier =
          subpath === "." ? name : `${name}/${subpath.replace(/^\.\//, "")}`;

        exportEntries.push({
          specifier,
          subpath,
          files: resolvedTargets,
        });
      }

      const name = typeof pkg.name === "string" ? pkg.name : "";

      return {
        name,
        dir,
        hasExports: exportEntries.length > 0,
        exportEntries,
      };
    })
    .filter((workspace) => workspace.name);
}

function getWorkspaceForFile(filePath: string, workspaces: Workspace[]) {
  return workspaces.find((workspace) => {
    const rel = path.relative(workspace.dir, filePath);
    return rel && !rel.startsWith("..") && !path.isAbsolute(rel);
  });
}

function listSourceFiles(): string[] {
  const files: string[] = [];
  for (const root of workspaceRoots) {
    const fullRoot = path.join(repoRoot, root);
    if (!fs.existsSync(fullRoot)) continue;
    walk(fullRoot, (filePath) => {
      if (!sourceExtensions.has(path.extname(filePath))) return;
      files.push(filePath);
    });
  }
  return files;
}

// ── Syntactic analysis (replaces ts.Program) ─────────────────────────────
// ts.createSourceFile is a pure parser — no module resolution, no type graph.
// Orders of magnitude faster than ts.createProgram for large workspaces.
//
// To match the old ts.Program behavior, we resolve re-exports transitively:
// `export { foo } from './bar'` and `export * from './bar'` propagate the
// exported names of ./bar to the current file. This is done syntactically
// (resolving relative specifiers to files on disk), without a type checker.

const sourceFileCache = new Map<string, ts.SourceFile | null>();

function parseSourceFile(filePath: string): ts.SourceFile | null {
  const cached = sourceFileCache.get(filePath);
  if (cached !== undefined) return cached;
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.ES2024,
      true,
      filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    sourceFileCache.set(filePath, sourceFile);
    return sourceFile;
  } catch {
    sourceFileCache.set(filePath, null);
    return null;
  }
}

const sourceExtensionsForResolution = new Set([
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
]);

function resolveModuleSpecifier(
  importerPath: string,
  specifier: string,
): string | null {
  // Only resolve relative specifiers — bare specifiers are node_modules
  if (!specifier.startsWith(".")) return null;

  const baseDir = path.dirname(importerPath);
  const target = path.resolve(baseDir, specifier);

  // Exact match
  if (fs.existsSync(target) && fs.statSync(target).isFile()) return target;

  // Try with extensions
  for (const ext of sourceExtensionsForResolution) {
    const withExt = `${target}${ext}`;
    if (fs.existsSync(withExt)) return withExt;
  }

  // Try index files
  for (const ext of sourceExtensionsForResolution) {
    const indexFile = path.join(target, `index${ext}`);
    if (fs.existsSync(indexFile)) return indexFile;
  }

  return null;
}

type ReExport = {
  // Named re-exports: export { foo, bar as baz } from './mod'
  named: Map<string, string>; // exportedName -> localName
  // Namespace re-exports: export * from './mod'
  namespace: string[];
};

function extractReExports(sourceFile: ts.SourceFile): {
  reExports: ReExport;
  localExports: string[];
} {
  const reExports: ReExport = {
    named: new Map(),
    namespace: [],
  };
  const localExports: string[] = [];

  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement) && statement.moduleSpecifier) {
      // Re-export with from clause
      const moduleSpecifier = statement.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        const resolved = resolveModuleSpecifier(
          sourceFile.fileName,
          moduleSpecifier.text,
        );
        if (!resolved) continue;

        if (
          statement.exportClause &&
          ts.isNamedExports(statement.exportClause)
        ) {
          // export { foo as bar } from './mod' — bar is exported, foo is local
          for (const element of statement.exportClause.elements) {
            const localName = element.propertyName?.text ?? element.name.text;
            reExports.named.set(element.name.text, localName);
          }
        } else if (!statement.exportClause) {
          // export * from './mod'
          reExports.namespace.push(resolved);
        }
      }
    } else if (
      ts.isExportDeclaration(statement) &&
      !statement.moduleSpecifier
    ) {
      // export { foo, bar as baz } — local re-export (no from)
      if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) {
          localExports.push(element.name.text);
        }
      }
    } else {
      // Direct exports: export const/function/class/interface/type/enum
      const modifiers = ts.canHaveModifiers(statement)
        ? ts.getModifiers(statement)
        : undefined;
      const isExported = modifiers?.some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword,
      );

      if (isExported) {
        if (ts.isVariableStatement(statement)) {
          for (const decl of statement.declarationList.declarations) {
            if (ts.isIdentifier(decl.name)) localExports.push(decl.name.text);
          }
        } else if (
          ts.isFunctionDeclaration(statement) ||
          ts.isClassDeclaration(statement) ||
          ts.isInterfaceDeclaration(statement) ||
          ts.isTypeAliasDeclaration(statement) ||
          ts.isEnumDeclaration(statement)
        ) {
          if (statement.name) localExports.push(statement.name.text);
        }
      }
    }
  }

  return { reExports, localExports };
}

// Cache: filePath -> Set of all exported names (including transitive re-exports)
const allExportsCache = new Map<string, Set<string>>();

function getAllExportedNames(filePath: string): Set<string> {
  const cached = allExportsCache.get(filePath);
  if (cached) return cached;

  // Guard against cycles
  allExportsCache.set(filePath, new Set());

  const sourceFile = parseSourceFile(filePath);
  if (!sourceFile) {
    return allExportsCache.get(filePath) ?? new Set();
  }

  const { reExports, localExports } = extractReExports(sourceFile);
  const result = new Set<string>(localExports);

  // Resolve named re-exports: export { foo } from './bar'
  // The local name 'foo' in './bar' becomes an export of this file
  for (const [, localName] of reExports.named) {
    result.add(localName);
  }

  // Resolve namespace re-exports: export * from './bar'
  for (const targetPath of reExports.namespace) {
    const targetExports = getAllExportedNames(targetPath);
    for (const name of targetExports) {
      result.add(name);
    }
  }

  allExportsCache.set(filePath, result);
  return result;
}

function collectImportUsages(workspaces: Workspace[]) {
  const usageBySpecifier = new Map<string, SpecifierUsage>();
  const workspaceNames = workspaces
    .map((workspace) => workspace.name)
    .sort((left, right) => right.length - left.length);

  const sourceFiles = listSourceFiles();

  for (const filePath of sourceFiles) {
    const sourceFile = parseSourceFile(filePath);
    if (!sourceFile) continue;

    const importerWorkspace = getWorkspaceForFile(filePath, workspaces);
    if (!importerWorkspace) continue;

    const record = (
      specifier: string,
      mode: ExportMode,
      importedName: string | null = null,
    ) => {
      const owner = workspaceNames.find(
        (name) => specifier === name || specifier.startsWith(`${name}/`),
      );
      if (!owner || owner === importerWorkspace.name) return;

      const usage = usageBySpecifier.get(specifier) ?? {
        all: false,
        names: new Set<string>(),
      };
      usageBySpecifier.set(specifier, usage);

      if (mode === "all") {
        usage.all = true;
      } else if (importedName) {
        usage.names.add(importedName);
      }
    };

    function visit(node: ts.Node) {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        const specifier = node.moduleSpecifier.text;

        if (ts.isImportDeclaration(node)) {
          const clause = node.importClause;
          if (!clause) {
            record(specifier, "all");
          } else {
            if (clause.name) record(specifier, "all");
            if (clause.namedBindings) {
              if (ts.isNamespaceImport(clause.namedBindings)) {
                record(specifier, "all");
              } else {
                for (const element of clause.namedBindings.elements) {
                  record(
                    specifier,
                    "named",
                    element.propertyName?.text ?? element.name.text,
                  );
                }
              }
            }
          }
        } else if (!node.exportClause) {
          record(specifier, "all");
        } else if (ts.isNamedExports(node.exportClause)) {
          for (const element of node.exportClause.elements) {
            record(
              specifier,
              "named",
              element.propertyName?.text ?? element.name.text,
            );
          }
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  return usageBySpecifier;
}

// ── Main ─────────────────────────────────────────────────────────────────

const workspaces = buildWorkspaces();
const usageBySpecifier = collectImportUsages(workspaces);

const findings: Finding[] = [];
const exportedWorkspaces = workspaces.filter(
  (workspace) => workspace.hasExports,
);

for (const workspace of exportedWorkspaces) {
  for (const entry of workspace.exportEntries) {
    const exportedNames = [
      ...new Set(
        entry.files.flatMap((filePath) => [...getAllExportedNames(filePath)]),
      ),
    ].sort((left, right) => left.localeCompare(right));

    if (!exportedNames.length) continue;

    const usage = usageBySpecifier.get(entry.specifier);
    const unusedExports =
      !usage || usage.all
        ? usage?.all
          ? []
          : exportedNames
        : exportedNames.filter((name) => !usage.names.has(name));

    if (!unusedExports.length) continue;

    const finding: Finding = {
      workspace: workspace.name,
      specifier: entry.specifier,
      files: entry.files.map((filePath) =>
        toPosix(path.relative(repoRoot, filePath)),
      ),
      unusedExports,
    };
    findings.push(finding);

    if (findings.length <= limit) {
      if (findings.length === 1) {
        console.log(
          chalk.yellow.bold("\n⚠️  Workspace export sets with no consumers:\n"),
        );
      }

      console.log(chalk.cyan.bold(finding.specifier));
      console.log(
        `  ${chalk.gray.bold("workspace:")} ${chalk.yellow.bold(finding.workspace)}`,
      );
      console.log(
        `  ${chalk.gray.bold("files:")} ${chalk.yellow.bold(finding.files.join(", "))}`,
      );
      console.log(`  ${chalk.gray.bold("unused exports:")}`);
      for (const unusedExport of finding.unusedExports) {
        console.log(`    ${chalk.yellow("-")} ${chalk.magenta(unusedExport)}`);
      }
      console.log("");
    }
  }
}

if (!findings.length) {
  console.log(chalk.green("✓ No unused workspace exports found."));
  process.exit(0);
}

if (findings.length > limit) {
  console.log(
    chalk.gray(
      `... ${findings.length - limit} more workspace export set(s) omitted ...\n`,
    ),
  );
}

console.log(
  chalk.yellow.bold(
    `⚠️  ${findings.length} workspace export set(s) with no consumers in total.`,
  ),
);

process.exitCode = 1;
