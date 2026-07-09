import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import ts from "typescript";

const repoRoot = process.cwd();
const workspaceRoots = [
  "apps",
  "services",
  "packages",
  "repositories",
  "database",
];

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

const ignoredDirs = new Set([
  "node_modules",
  "dist",
  "build",
  ".turbo",
  ".git",
  "coverage",
]);

function printProgress(label, current, total) {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round(percentage / 5);
  const empty = 20 - filled;
  const bar = `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
  process.stdout.write(
    chalk.blue(`\r${label} ${bar} ${percentage}% (${current}/${total})`),
  );
}

function clearProgress() {
  process.stdout.write("\r" + " ".repeat(80) + "\r");
}

function walk(dir, visitor) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, visitor);
      continue;
    }
    visitor(fullPath);
  }
}

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function listWorkspacePackageJsons() {
  const manifests = [];
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
  exportsField,
  subpath = ".",
  collector = new Map(),
) {
  if (typeof exportsField === "string") {
    if (!collector.has(subpath)) collector.set(subpath, []);
    collector.get(subpath).push(exportsField);
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

function buildWorkspaces() {
  return listWorkspacePackageJsons()
    .map((manifestPath) => {
      const pkg = readJson(manifestPath);
      const dir = path.dirname(manifestPath);
      const exportTargets = collectExportTargets(pkg.exports ?? {});
      const exportEntries = [];

      for (const [subpath, targets] of exportTargets) {
        const resolvedTargets = [...new Set(targets)]
          .filter((target) => typeof target === "string")
          .filter((target) => !target.includes("*"))
          .map((target) => path.resolve(dir, target))
          .filter((target) => sourceExtensions.has(path.extname(target)))
          .filter((target) => fs.existsSync(target));

        if (!resolvedTargets.length) continue;

        const specifier =
          subpath === "."
            ? pkg.name
            : `${pkg.name}/${subpath.replace(/^\.\//, "")}`;

        exportEntries.push({
          specifier,
          subpath,
          files: resolvedTargets,
        });
      }

      return {
        name: pkg.name,
        dir,
        hasExports: exportEntries.length > 0,
        exportEntries,
      };
    })
    .filter((workspace) => workspace.name);
}

function getWorkspaceForFile(filePath, workspaces) {
  return workspaces.find((workspace) => {
    const rel = path.relative(workspace.dir, filePath);
    return rel && !rel.startsWith("..") && !path.isAbsolute(rel);
  });
}

function listSourceFiles() {
  const files = [];
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

function getModuleExports(checker, sourceFile) {
  const symbol = checker.getSymbolAtLocation(sourceFile);
  if (!symbol) return [];
  return checker
    .getExportsOfModule(symbol)
    .map((exportSymbol) => exportSymbol.escapedName.toString())
    .filter((name) => name !== "default");
}

function ensureUse(target, mode, importedName) {
  if (mode === "all") {
    target.all = true;
    return;
  }
  target.names.add(importedName);
}

function collectExternalImports(program, workspaces) {
  const usageBySpecifier = new Map();
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
  const total = sourceFiles.length;

  for (let index = 0; index < sourceFiles.length; index++) {
    const sourceFile = sourceFiles[index];
    if (
      index % Math.max(1, Math.floor(total / 10)) === 0 ||
      index === total - 1
    ) {
      printProgress("Analyzing imports", index + 1, total);
    }

    const importerWorkspace = getWorkspaceForFile(
      sourceFile.fileName,
      workspaces,
    );
    if (!importerWorkspace) continue;

    const record = (specifier, mode, importedName = null) => {
      const owner = workspaceNames.find(
        (name) => specifier === name || specifier.startsWith(`${name}/`),
      );
      if (!owner || owner === importerWorkspace.name) return;

      if (!usageBySpecifier.has(specifier)) {
        usageBySpecifier.set(specifier, { all: false, names: new Set() });
      }

      ensureUse(usageBySpecifier.get(specifier), mode, importedName);
    };

    function visit(node) {
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

  clearProgress();
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
console.log(
  chalk.blue(`Analyzing imports across ${sourceFiles.length} source files...`),
);
const usageBySpecifier = collectExternalImports(program, workspaces);

const findings = [];
const exportedWorkspaces = workspaces.filter(
  (workspace) => workspace.hasExports,
);
const exportedTotal = exportedWorkspaces.reduce(
  (sum, workspace) => sum + workspace.exportEntries.length,
  0,
);

console.log(chalk.blue("Checking workspace exports for external consumers..."));

for (const workspace of exportedWorkspaces) {
  for (const entry of workspace.exportEntries) {
    checkedCount++;
    printProgress("Checking exports", checkedCount, exportedTotal);
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

    const finding = {
      workspace: workspace.name,
      specifier: entry.specifier,
      files: entry.files.map((filePath) =>
        toPosix(path.relative(repoRoot, filePath)),
      ),
      unusedExports,
    };
    findings.push(finding);

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

if (!findings.length) {
  console.log(chalk.green("✓ No externally-unused workspace exports found."));
  process.exit(0);
}

console.log(
  chalk.yellow.bold(
    `⚠️  ${findings.length} workspace export set(s) with no external consumers in total.`,
  ),
);

process.exitCode = 1;
