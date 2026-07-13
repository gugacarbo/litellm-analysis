import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const scriptPath = resolve(
  import.meta.dirname,
  "./check-ui-client-boundary.ts",
);

function runGuard(): { exitCode: number; stdout: string; stderr: string } {
  try {
    const stdout = execSync(`node --experimental-strip-types ${scriptPath}`, {
      encoding: "utf-8",
      cwd: resolve(import.meta.dirname, "../.."),
    });
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

describe("check-ui-client-boundary", () => {
  it("retorna exit code 0 quando nao ha violacoes", () => {
    const result = runGuard();
    expect(result.exitCode).toBe(0);
  });

  it("nao rejeita rotas REST proprias em apps/ui/src/routes/api", () => {
    // A rota api/auth/$ e api/auth/accept-invite sao infraestrutura propria
    const result = runGuard();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("no violations found");
  });

  it("nao rejeita o transporte gerado do TanStack Start", () => {
    // routeTree.gen.ts e permitido
    const result = runGuard();
    expect(result.exitCode).toBe(0);
  });

  it("nao rejeita arquivos de teste", () => {
    const result = runGuard();
    expect(result.exitCode).toBe(0);
  });
});
