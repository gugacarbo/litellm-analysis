#!/usr/bin/env node

/**
 * Checks staged JavaScript/TypeScript additions for real console.log calls.
 *
 * The staged blob is parsed with TypeScript so comments and strings are not
 * false positives. Existing calls are allowed because only added diff lines
 * are considered.
 */

import { execFileSync } from "node:child_process";
import { extname } from "node:path";
import ts from "typescript";

type AddedLines = Set<number>;

interface StagedFile {
  path: string;
  addedLines: AddedLines;
}

interface Violation {
  file: string;
  line: number;
}

const SOURCE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
]);

function isRelevantPath(filePath: string): boolean {
  return SOURCE_EXTENSIONS.has(extname(filePath).toLowerCase());
}

function isExceptionPath(filePath: string): boolean {
  const segments = filePath.replaceAll("\\", "/").split("/");
  return (
    (segments[0] === "packages" && segments[1] === "logger") ||
    segments.includes("scripts")
  );
}

function parseAddedLines(diff: string): StagedFile[] {
  const files: StagedFile[] = [];
  let current: StagedFile | undefined;
  let nextLine = 0;

  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ b/")) {
      const path = line.slice("+++ b/".length);
      current =
        isRelevantPath(path) && !isExceptionPath(path)
          ? { path, addedLines: new Set() }
          : undefined;
      if (current) files.push(current);
      continue;
    }

    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (hunk) {
      nextLine = Number(hunk[1]);
      continue;
    }

    if (!current || nextLine === 0 || line.startsWith("\\")) continue;
    if (line.startsWith("+")) {
      current.addedLines.add(nextLine);
      nextLine += 1;
      continue;
    }
    if (!line.startsWith("-")) nextLine += 1;
  }

  return files;
}

function stagedDiff(): string {
  try {
    return execFileSync(
      "git",
      [
        "diff",
        "--cached",
        "--unified=0",
        "--no-ext-diff",
        "--diff-filter=ACMRT",
        "--",
      ],
      { encoding: "utf8" },
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Unable to inspect staged changes with git diff --cached: ${detail}`,
    );
  }
}

function stagedContent(filePath: string): string {
  try {
    return execFileSync("git", ["show", `:${filePath}`], {
      encoding: "utf8",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to read staged blob ${filePath}: ${detail}`);
  }
}

function scriptKind(filePath: string): ts.ScriptKind {
  switch (extname(filePath).toLowerCase()) {
    case ".tsx":
      return ts.ScriptKind.TSX;
    case ".jsx":
      return ts.ScriptKind.JSX;
    case ".js":
    case ".mjs":
    case ".cjs":
      return ts.ScriptKind.JS;
    default:
      return ts.ScriptKind.TS;
  }
}

function findViolations(file: StagedFile): Violation[] {
  const content = stagedContent(file.path);
  const sourceFile = ts.createSourceFile(
    file.path,
    content,
    ts.ScriptTarget.Latest,
    true,
    scriptKind(file.path),
  );
  const violations: Violation[] = [];

  function visit(node: ts.Node): void {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "console" &&
      node.expression.name.text === "log"
    ) {
      const start =
        sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
          .line + 1;
      const end =
        sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
      for (let line = start; line <= end; line += 1) {
        if (file.addedLines.has(line)) {
          violations.push({ file: file.path, line: start });
          break;
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

export function checkStagedConsoleLogs(diff = stagedDiff()): Violation[] {
  return parseAddedLines(diff).flatMap(findViolations);
}

function main(): void {
  let violations: Violation[];
  try {
    violations = checkStagedConsoleLogs();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`❌ Staged console.log check failed: ${detail}`);
    process.exitCode = 1;
    return;
  }
  if (violations.length > 0) {
    console.error("❌ New console.log calls found in staged additions:\n");
    for (const violation of violations) {
      console.error(
        `  ${violation.file}:${violation.line} — console.log is not allowed`,
      );
    }
    process.exitCode = 1;
    return;
  }

  console.log("✅ Staged console.log check: no violations found");
}

main();
