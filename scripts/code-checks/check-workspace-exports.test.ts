import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const scriptPath = resolve(import.meta.dirname, "./check-workspace-exports.ts");

function runCheck(args = ""): {
  exitCode: number;
  stdout: string;
  stderr: string;
} {
  try {
    const stdout = execSync(
      `node --experimental-strip-types ${scriptPath} ${args}`,
      {
        encoding: "utf-8",
        cwd: resolve(import.meta.dirname, "../.."),
      },
    );
    return { exitCode: 0, stdout, stderr: "" };
  } catch (err) {
    const error = err as {
      status?: number;
      stdout?: string;
      stderr?: string;
    };
    return {
      exitCode: error.status ?? 1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? "",
    };
  }
}

describe("check-workspace-exports", () => {
  // O script faz parse de todos os source files do workspace (~1.5s)
  const LONG_TIMEOUT = 15_000;

  it(
    "roda sem crash e retorna exit code 0 ou 1",
    () => {
      const result = runCheck();
      // exit 0 = sem findings, exit 1 = ha exports sem consumidores diretos
      expect([0, 1]).toContain(result.exitCode);
    },
    LONG_TIMEOUT,
  );

  it(
    "exibe mensagem apropriada conforme o estado do repo",
    () => {
      const result = runCheck();
      if (result.exitCode === 0) {
        expect(result.stdout).toContain("No unused workspace exports found");
      } else {
        expect(result.stdout).toContain(
          "Workspace export sets with no consumers",
        );
      }
    },
    LONG_TIMEOUT,
  );

  it(
    "aceita flag --limit e nao quebra",
    () => {
      const result = runCheck("--limit=5");
      // Deve rodar sem crash — exit code depende do estado atual do repo
      expect([0, 1]).toContain(result.exitCode);
    },
    LONG_TIMEOUT,
  );

  it("rejeita --limit invalido com exit code 1", () => {
    const result = runCheck("--limit=invalid");
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Invalid --limit value");
  });

  it("rejeita --limit negativo com exit code 1", () => {
    const result = runCheck("--limit=-1");
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Invalid --limit value");
  });

  it(
    "roda sem crash com --limit=0",
    () => {
      const result = runCheck("--limit=0");
      expect([0, 1]).toContain(result.exitCode);
    },
    LONG_TIMEOUT,
  );
});
