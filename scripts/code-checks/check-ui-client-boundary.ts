#!/usr/bin/env node

/**
 * check-ui-client-boundary.ts
 *
 * Guarda arquitetural que verifica se módulos client-side do apps/ui
 * importam código server-only ou referenciam a API legada do apps/server.
 *
 * Uso:
 *   node --experimental-strip-types scripts/code-checks/check-ui-client-boundary.ts
 *
 * Exit codes:
 *   0 — nenhuma violação
 *   1 — violação detectada
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "..", "..");

// Padrões de imports server-only que NÃO podem aparecer em módulos client-side
const SERVER_ONLY_IMPORTS = [
  { pattern: /from\s+["']drizzle-orm["']/, label: "drizzle-orm" },
  {
    pattern: /from\s+["']@lite-llm\/database["']/,
    label: "@lite-llm/database",
  },
  { pattern: /from\s+["']pg["']/, label: "pg" },
  {
    pattern: /from\s+["']@better-auth\/drizzle-adapter["']/,
    label: "@better-auth/drizzle-adapter",
  },
  { pattern: /from\s+["']better-auth["']/, label: "better-auth" },
  {
    pattern: /from\s+["']better-auth\/plugins["']/,
    label: "better-auth/plugins",
  },
  {
    pattern: /from\s+["']better-auth\/tanstack-start["']/,
    label: "better-auth/tanstack-start",
  },
  { pattern: /from\s+["']node:crypto["']/, label: "node:crypto" },
  { pattern: /from\s+["']node:fs["']/, label: "node:fs" },
  { pattern: /from\s+["']node:path["']/, label: "node:path" },
  { pattern: /from\s+["']node:http["']/, label: "node:http" },
  { pattern: /from\s+["']node:stream["']/, label: "node:stream" },
  {
    pattern: /from\s+["']@tanstack\/react-start\/server["']/,
    label: "@tanstack/react-start/server",
  },
  {
    pattern: /from\s+["']@tanstack\/react-start["']/,
    label: "@tanstack/react-start",
  },
  {
    pattern: /from\s+["']@tanstack\/start-server-core["']/,
    label: "@tanstack/start-server-core",
  },
];

// Padrões de referência à API legada do apps/server
// Nota: imports de server functions (*.functions.ts) são o transporte
// gerado pelo TanStack Start e são permitidos.
const LEGACY_API_REFERENCES = [
  { pattern: /from\s+["']@lite-llm\/server["']/, label: "@lite-llm/server" },
  { pattern: /apps\/server\//, label: "apps/server" },
];

// Módulos server-only do próprio apps/ui que NÃO podem ser importados do client
// Nota: server functions (*.functions.ts) são permitidas via createServerFn —
// o TanStack Start gera o transporte automaticamente entre client e server.
const SERVER_ONLY_MODULES = [
  { pattern: /\/server\/auth\//, label: "server/auth/" },
  { pattern: /\/server\/context\.ts$/, label: "server/context.ts" },
];

// Diretórios client-side a verificar
const CLIENT_DIRS = [
  resolve(rootDir, "apps/ui/src/routes"),
  resolve(rootDir, "apps/ui/src/components"),
  resolve(rootDir, "apps/ui/src/lib"),
];

interface Violation {
  file: string;
  line: number;
  type: string;
  detail: string;
}

function isAllowed(filePath: string): boolean {
  const relative = filePath.replace(rootDir, "");
  // Rotas de API são server-side (infraestrutura própria)
  if (relative.includes("apps/ui/src/routes/api/")) return true;
  // Test files
  if (relative.endsWith(".test.ts") || relative.endsWith(".test.tsx"))
    return true;
  // Generated route tree
  if (relative.endsWith("routeTree.gen.ts")) return true;
  return false;
}

function checkFile(filePath: string): Violation[] {
  if (isAllowed(filePath)) return [];

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const violations: Violation[] = [];

  // Check for server-only imports
  for (const { pattern, label } of SERVER_ONLY_IMPORTS) {
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        violations.push({
          file: filePath,
          line: i + 1,
          type: "server-only-import",
          detail: `Server-only import '${label}': ${lines[i].trim()}`,
        });
      }
    }
  }

  // Check for legacy API references
  for (const { pattern, label } of LEGACY_API_REFERENCES) {
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        violations.push({
          file: filePath,
          line: i + 1,
          type: "legacy-api-reference",
          detail: `Legacy API reference '${label}': ${lines[i].trim()}`,
        });
      }
    }
  }

  // Check for imports of server-only modules from client code
  for (let i = 0; i < lines.length; i++) {
    const importMatch = lines[i].match(/from\s+["']([^"']+)["']/);
    if (importMatch) {
      const importPath = importMatch[1];
      for (const { pattern, label } of SERVER_ONLY_MODULES) {
        if (pattern.test(importPath)) {
          violations.push({
            file: filePath,
            line: i + 1,
            type: "server-only-module-import",
            detail: `Import of server-only module '${label}': ${lines[i].trim()}`,
          });
        }
      }
    }
  }

  return violations;
}

function collectFiles(dir: string): string[] {
  const results: string[] = [];
  const list = readdirSync(dir);
  for (const item of list) {
    const fullPath = resolve(dir, item);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...collectFiles(fullPath));
    } else if (
      fullPath.endsWith(".ts") ||
      fullPath.endsWith(".tsx") ||
      fullPath.endsWith(".js") ||
      fullPath.endsWith(".jsx")
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

function main(): void {
  let allViolations: Violation[] = [];

  for (const clientDir of CLIENT_DIRS) {
    if (!existsSync(clientDir)) continue;
    const files = collectFiles(clientDir);
    for (const file of files) {
      const violations = checkFile(file);
      allViolations = allViolations.concat(violations);
    }
  }

  if (allViolations.length > 0) {
    console.error("❌ UI Client Boundary Violations Found:\n");
    for (const v of allViolations) {
      const relative = v.file.replace(rootDir, "");
      console.error(`  [${v.type}] ${relative}:${v.line}`);
      console.error(`    ${v.detail}\n`);
    }
    process.exit(1);
  }

  console.log("✅ UI Client Boundary: no violations found");
  process.exit(0);
}

main();
