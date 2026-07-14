import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const scriptPath = resolve(import.meta.dirname, "./check-console-log.ts");
const temporaryDirectories: string[] = [];

function git(cwd: string, ...args: string[]): void {
  execFileSync("git", args, { cwd, stdio: "ignore" });
}

function createRepo(files: Record<string, string>, staged = true): string {
  const cwd = mkdtempSync(join(tmpdir(), "check-console-log-"));
  temporaryDirectories.push(cwd);
  git(cwd, "init", "-q");
  git(cwd, "config", "user.email", "test@example.com");
  git(cwd, "config", "user.name", "Test");

  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = join(cwd, relativePath);
    mkdirSync(resolve(filePath, ".."), { recursive: true });
    writeFileSync(filePath, content);
  }
  if (staged) git(cwd, "add", "--", ".");
  return cwd;
}

function runGuard(cwd: string): {
  exitCode: number;
  stdout: string;
  stderr: string;
} {
  try {
    const stdout = execFileSync(
      "node",
      ["--experimental-strip-types", scriptPath],
      {
        cwd,
        encoding: "utf-8",
      },
    );
    return { exitCode: 0, stdout, stderr: "" };
  } catch (error) {
    const result = error as {
      status?: number;
      stdout?: string;
      stderr?: string;
    };
    return {
      exitCode: result.status ?? 1,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    };
  }
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("check-console-log", () => {
  it("falha com diagnóstico quando git não consegue inspecionar o staged", () => {
    const cwd = mkdtempSync(join(tmpdir(), "check-console-log-not-git-"));
    temporaryDirectories.push(cwd);

    const result = runGuard(cwd);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Staged console.log check failed");
    expect(result.stderr).toContain("git diff --cached");
  });

  it("ignora ausência de arquivos staged relevantes", () => {
    const cwd = createRepo({ "README.md": "texto\n" }, false);

    expect(runGuard(cwd)).toMatchObject({ exitCode: 0 });
  });

  it("ignora console.log legado quando somente outra linha é adicionada", () => {
    const cwd = createRepo({ "src/example.ts": 'console.log("legado");\n' });
    git(cwd, "commit", "-qm", "baseline");
    writeFileSync(
      join(cwd, "src/example.ts"),
      'console.log("legado");\nconst value = 1;\n',
    );
    git(cwd, "add", "src/example.ts");

    expect(runGuard(cwd)).toMatchObject({ exitCode: 0 });
  });

  it("ignora uma chamada removida do diff staged", () => {
    const cwd = createRepo({ "src/example.ts": 'console.log("removido");\n' });
    git(cwd, "commit", "-qm", "baseline");
    writeFileSync(join(cwd, "src/example.ts"), "const value = 1;\n");
    git(cwd, "add", "src/example.ts");

    expect(runGuard(cwd)).toMatchObject({ exitCode: 0 });
  });

  it("ignora comentários, strings e chamadas nas exceções de caminho", () => {
    const cwd = createRepo({
      "src/example.ts": `${[
        '// console.log("comment");',
        "const text = \"console.log('string')\";",
        'console.info("allowed level");',
      ].join("\n")}\n`,
      "packages/logger/src/index.ts": 'console.log("package exception");\n',
      "tools/scripts/cli.ts": 'console.log("scripts exception");\n',
    });

    expect(runGuard(cwd)).toMatchObject({ exitCode: 0 });
  });

  it("rejeita uma chamada real adicionada e informa arquivo e linha", () => {
    const cwd = createRepo({ "src/example.ts": "const value = 1;\n" });
    writeFileSync(
      join(cwd, "src/example.ts"),
      "const value = 1;\nconsole.log(value);\n",
    );
    git(cwd, "add", "src/example.ts");

    const result = runGuard(cwd);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("src/example.ts:2");
    expect(result.stderr).toContain("console.log");
  });

  it("rejeita chamada multilinear quando sua linha adicionada contém console.log", () => {
    const cwd = createRepo({ "src/example.ts": "const value = 1;\n" });
    writeFileSync(
      join(cwd, "src/example.ts"),
      "const value = 1;\nconsole.log(\n  value,\n);\n",
    );
    git(cwd, "add", "src/example.ts");

    const result = runGuard(cwd);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("src/example.ts:2");
  });

  it("mantém os gates existentes no pre-commit e expõe o comando dedicado", () => {
    const hook = readFileSync(
      resolve(import.meta.dirname, "../pre-commit"),
      "utf8",
    );
    const packageJson = JSON.parse(
      readFileSync(resolve(import.meta.dirname, "../../package.json"), "utf8"),
    ) as { scripts: Record<string, string> };
    const dollar = "$";

    expect(packageJson.scripts["check:console-log"]).toBe(
      "node --experimental-strip-types scripts/code-checks/check-console-log.ts",
    );
    expect(hook).toContain(`"${dollar}{ROOT}/scripts/docs-check"`);
    expect(hook).toContain(`${dollar}{NODE_ENV_RUNNER} check:console-log`);
    expect(hook).toContain(`${dollar}{NODE_ENV_RUNNER} check-staged`);
  });
});
