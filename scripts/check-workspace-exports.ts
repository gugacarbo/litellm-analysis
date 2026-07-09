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

function getModuleExports(checker: ts.TypeChecker, sourceFile: ts.SourceFile) {
  const symbol = checker.getSymbolAtLocation(sourceFile);
  if (!symbol) return [];
  return checker
    .getExportsOfModule(symbol)
    .map((exportSymbol) => exportSymbol.escapedName.toString())
    .filter((name) => name !== "default");
}

function ensureUse(
  target: SpecifierUsage,
  mode: ExportMode,
  importedName: string | null,
) {
  if (mode === "all") {
    target.all = true;
    return;
  }
  if (importedName) {
    target.names.add(importedName);
  }
}

function collectExternalImports(program: ts.Program, workspaces: Workspace[]) {
  const usageBySpecifier = new Map<string, SpecifierUsage>();
  const workspaceNames = workspaces
    .map((workspace) => workspace.name)
    .sort((left, right) => right.length - left.length);

  const sourceFiles = program
    .getSourceFiles()
    .filter(
      (sourceFile) =>
        !sourceFile.isDeclarationFile &&
        sourceFile.fileName.startsWith(repoRoot),
    );

  for (const sourceFile of sourceFiles) {
    const importerWorkspace = getWorkspaceForFile(
      sourceFile.fileName,
      workspaces,
    );
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

      ensureUse(usage, mode, importedName);
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

const workspaces = buildWorkspaces();
const sourceFiles = listSourceFiles();
const program = ts.createProgram(sourceFiles, {
  allowImportingTsExtensions: true,
  jsx: ts.JsxEmit.ReactJSX,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  noEmit: true,
  skipLibCheck: true,
  target: ts.ScriptTarget.ES2024,
});
const checker = program.getTypeChecker();

const usageBySpecifier = collectExternalImports(program, workspaces);
const findings: Finding[] = [];
const exportedWorkspaces = workspaces.filter(
  (workspace) => workspace.hasExports,
);

for (const workspace of exportedWorkspaces) {
  for (const entry of workspace.exportEntries) {
    const exportedNames = [
      ...new Set(
        entry.files.flatMap((filePath) => {
          const sourceFile = program.getSourceFile(filePath);
          return sourceFile ? getModuleExports(checker, sourceFile) : [];
        }),
      ),
    ].sort();

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
          chalk.yellow.bold(
            "\n⚠️  Workspace export sets with no external consumers:\n",
          ),
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
  console.log(chalk.green("✓ No externally-unused workspace exports found."));
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
    `⚠️  ${findings.length} workspace export set(s) with no external consumers in total.`,
  ),
);

process.exitCode = 1;
