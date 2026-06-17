#!/usr/bin/env tsx
/**
 * sync-cloud-litellm.ts
 *
 * Sincroniza dados de um LiteLLM cloud para o banco PostgreSQL local.
 *
 * Uso:
 *   pnpm tsx scripts/sync-cloud-litellm/index.ts fetch [opções]
 *   pnpm tsx scripts/sync-cloud-litellm/index.ts stats <arquivo>
 *   pnpm tsx scripts/sync-cloud-litellm/index.ts import <arquivo>
 *
 * Etapas:
 *   1. fetch  → baixa spend logs do LiteLLM cloud via API REST e salva como JSON
 *   2. review → (manual) veja o JSON gerado, confira os dados
 *   3. import  → lê o JSON e grava em model_proxy_requests via legacy spend adapter
 *
 * Variáveis de ambiente:
 *   LITELLM_CLOUD_URL        (obrigatório no fetch) URL base do LiteLLM cloud
 *   LITELLM_CLOUD_API_KEY    (obrigatório no fetch) API key do LiteLLM cloud
 *   MODEL_PROXY_DATABASE_URL (obrigatório no import) PostgreSQL model_proxy_*
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { importCloudSpendLogs } from "@lite-llm/model-proxy-registry-service";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_OUTPUT_DIR = path.join(ROOT, "@storage", "output", "cloud-sync");
const DEFAULT_DAYS = 30;
const PAGE_SIZE = 100;

// ─── Help ────────────────────────────────────────────────────────────────────

function printHelp(): void {
  console.log(`
sync-cloud-litellm.ts — Sincroniza dados do LiteLLM cloud → PostgreSQL local

COMANDOS:

  fetch [opções]
    Baixa spend logs do LiteLLM cloud via API REST e salva como JSON.

    Opções:
      --days N       Últimos N dias de dados (default: ${DEFAULT_DAYS})
      --output FILE  Arquivo de saída (default: @storage/output/cloud-sync/spend-logs.json)

    Env:
      LITELLM_CLOUD_URL      (obrigatório)
      LITELLM_CLOUD_API_KEY  (obrigatório)

    Exemplo:
      LITELLM_CLOUD_URL=https://meu-litellm.cloud.com \
        LITELLM_CLOUD_API_KEY=sk-... \
        pnpm tsx scripts/sync-cloud-litellm/index.ts fetch --days 90

  stats <arquivo>
    Mostra estatísticas básicas do JSON baixado.

    Exemplo:
      pnpm tsx scripts/sync-cloud-litellm/index.ts stats @storage/output/cloud-sync/spend-logs.json

  import <arquivo> [opções]
    Importa o JSON para model_proxy_requests (MODEL_PROXY_DATABASE_URL).

    Opções:
      --dry-run   Simula import sem gravar
      --force     Atualiza rows já importadas

    Env:
      MODEL_PROXY_DATABASE_URL  (obrigatório)

    Exemplo:
      MODEL_PROXY_DATABASE_URL=postgresql://... \
        pnpm tsx scripts/sync-cloud-litellm/index.ts import @storage/output/cloud-sync/spend-logs.json
`);
}

// ─── Main dispatch ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    printHelp();
    return;
  }

  const command = args[0];

  switch (command) {
    case "fetch":
      await cmdFetch(args.slice(1));
      break;
    case "stats":
      await cmdStats(args.slice(1));
      break;
    case "import":
      await cmdImport(args.slice(1));
      break;
    default:
      console.error(`Comando desconhecido: ${command}\n`);
      printHelp();
      process.exit(1);
  }
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

interface FetchOptions {
  days: number;
  output: string;
}

async function cmdFetch(args: string[]): Promise<void> {
  const apiUrl = process.env.LITELLM_CLOUD_URL;
  const apiKey = process.env.LITELLM_CLOUD_API_KEY;

  if (!apiUrl) {
    console.error("ERRO: LITELLM_CLOUD_URL não definida");
    process.exit(1);
  }
  if (!apiKey) {
    console.error("ERRO: LITELLM_CLOUD_API_KEY não definida");
    process.exit(1);
  }

  const opts = parseFetchOptions(args);
  await mkdir(path.dirname(opts.output), { recursive: true });

  console.log(`🔍 Conectando em: ${apiUrl}`);
  console.log(`📅  Período: últimos ${opts.days} dias`);
  console.log(`📁  Saída:   ${opts.output}`);
  console.log("");

  const logs = await fetchAllSpendLogs(apiUrl, apiKey, opts.days);

  const output = {
    source: apiUrl,
    fetchedAt: new Date().toISOString(),
    days: opts.days,
    count: logs.length,
    logs,
  };

  await writeFile(opts.output, JSON.stringify(output, null, 2), "utf-8");
  console.log(`\n✅  ${logs.length} registros salvos em ${opts.output}`);

  // Mostrar resumo
  if (logs.length > 0) {
    const records = logs as Record<string, unknown>[];
    const models = new Set(records.map((log) => String(log.model ?? "?")));
    const totalSpend = records.reduce(
      (accumulator: number, log: Record<string, unknown>) =>
        accumulator +
        (typeof log.spend === "number" ? log.spend : Number(log.spend) || 0),
      0,
    );
    const totalTokens = records.reduce(
      (accumulator: number, log: Record<string, unknown>) =>
        accumulator +
        (typeof log.total_tokens === "number"
          ? log.total_tokens
          : Number(log.total_tokens) || 0),
      0,
    );
    const dates = records
      .map((log) => String(log.startTime ?? ""))
      .filter(Boolean)
      .sort();
    const from = dates[0] ?? "?";
    const to = dates[dates.length - 1] ?? "?";

    console.log("");
    console.log("📊  Resumo:");
    console.log(`   Modelos:     ${models.size}`);
    console.log(`   Período:     ${from.slice(0, 10)} → ${to.slice(0, 10)}`);
    console.log(`   Total spend: $${totalSpend.toFixed(4)}`);
    console.log(`   Total tokens: ${totalTokens.toLocaleString()}`);
  }
}

function parseFetchOptions(args: string[]): FetchOptions {
  let days = DEFAULT_DAYS;
  let output = path.join(DEFAULT_OUTPUT_DIR, "spend-logs.json");

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--days" && i + 1 < args.length) {
      const parsed = Number.parseInt(args[++i], 10);
      if (Number.isFinite(parsed) && parsed > 0) days = parsed;
    } else if (arg === "--output" && i + 1 < args.length) {
      output = path.resolve(ROOT, args[++i]);
    } else if (arg.startsWith("--output=")) {
      output = path.resolve(ROOT, arg.slice("--output=".length));
    } else if (arg.startsWith("--days=")) {
      const parsed = Number.parseInt(arg.slice("--days=".length), 10);
      if (Number.isFinite(parsed) && parsed > 0) days = parsed;
    } else {
      console.error(`Opção desconhecida: ${arg}`);
      process.exit(1);
    }
  }

  return { days, output };
}

async function fetchAllSpendLogs(
  baseUrl: string,
  apiKey: string,
  days: number,
): Promise<unknown[]> {
  const base = baseUrl.replace(/\/$/, "");
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 86_400_000);

  const allLogs: unknown[] = [];
  let page = 1;

  while (true) {
    const params = new URLSearchParams({
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      page: String(page),
      size: String(PAGE_SIZE),
    });

    const url = `${base}/spend/logs?${params}`;
    console.log(`   📥  Página ${page}...`);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `API HTTP ${response.status} em ${url}\n${body.slice(0, 500)}`,
      );
    }

    // A resposta pode ser array direto ou { data: [...] }
    const raw = await response.json();
    let items: unknown[] = [];

    if (Array.isArray(raw)) {
      items = raw;
    } else if (raw && Array.isArray((raw as Record<string, unknown>).data)) {
      items = (raw as Record<string, unknown>).data as unknown[];
    } else {
      // Última página — resposta vazia ou formato inesperado
      break;
    }

    if (items.length === 0) {
      break;
    }

    allLogs.push(...items);
    console.log(`   ✅  ${items.length} registros`);

    if (items.length < PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return allLogs;
}

// ─── Stats ───────────────────────────────────────────────────────────────────

interface SpendLogFile {
  logs?: unknown[];
}

async function cmdStats(args: string[]): Promise<void> {
  const file = getRequiredFileArg(args, "stats");
  const absoluteFile = path.resolve(ROOT, file);
  const raw = await readFile(absoluteFile, "utf-8");
  const parsed = JSON.parse(raw) as SpendLogFile;
  const logs = Array.isArray(parsed.logs) ? parsed.logs : [];

  console.log(`📄  Arquivo: ${absoluteFile}`);
  console.log(`📦  Registros: ${logs.length}`);

  if (logs.length === 0) {
    return;
  }

  const records = logs as Record<string, unknown>[];
  const uniqueModels = new Set(
    records.map((record) => String(record.model ?? "")).filter(Boolean),
  );
  const totalSpend = records.reduce(
    (accumulator: number, record: Record<string, unknown>) =>
      accumulator +
      (typeof record.spend === "number"
        ? record.spend
        : Number(record.spend) || 0),
    0,
  );
  const totalTokens = records.reduce(
    (accumulator: number, record: Record<string, unknown>) =>
      accumulator +
      (typeof record.total_tokens === "number"
        ? record.total_tokens
        : Number(record.total_tokens) || 0),
    0,
  );

  const sortedDates = records
    .map((record) => String(record.startTime ?? ""))
    .filter(Boolean)
    .sort();
  const firstDate = sortedDates[0] ?? "?";
  const lastDate = sortedDates[sortedDates.length - 1] ?? "?";

  console.log(`🤖  Modelos únicos: ${uniqueModels.size}`);
  console.log(
    `💸  Spend total: $${totalSpend.toFixed(6)} (${(
      totalSpend / logs.length
    ).toFixed(6)} por registro)`,
  );
  console.log(`🔢  Tokens totais: ${totalTokens.toLocaleString()}`);
  console.log(`🕒  Período: ${firstDate} → ${lastDate}`);
}

// ─── Import ──────────────────────────────────────────────────────────────────

interface ImportOptions {
  dryRun: boolean;
  force: boolean;
}

function parseImportOptions(args: string[]): {
  file: string;
  options: ImportOptions;
} {
  let dryRun = false;
  let force = false;
  const positional: string[] = [];

  for (const arg of args) {
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--force") {
      force = true;
      continue;
    }
    positional.push(arg);
  }

  const file = positional[0];
  if (!file) {
    console.error("Uso: import <arquivo> [--dry-run] [--force]");
    process.exit(1);
  }

  return {
    file,
    options: { dryRun, force },
  };
}

async function cmdImport(args: string[]): Promise<void> {
  if (!process.env.MODEL_PROXY_DATABASE_URL?.trim()) {
    console.error("ERRO: MODEL_PROXY_DATABASE_URL não definida");
    process.exit(1);
  }

  const { file, options } = parseImportOptions(args);
  const absoluteFile = path.resolve(ROOT, file);
  const raw = await readFile(absoluteFile, "utf-8");
  const parsed = JSON.parse(raw) as SpendLogFile;
  const logs = Array.isArray(parsed.logs) ? parsed.logs : [];

  console.log(`📄  Lendo arquivo: ${absoluteFile}`);
  console.log(`📦  Registros para importar: ${logs.length}`);

  if (logs.length === 0) {
    console.log("Nenhum registro para importar.");
    return;
  }

  const summary = await importCloudSpendLogs(
    logs as Record<string, unknown>[],
    {
      dryRun: options.dryRun,
      force: options.force,
      source: "cloud-sync",
    },
  );

  console.log(
    `\n✅  Import finalizado. imported=${summary.imported} skipped=${summary.skipped} errors=${summary.errors}`,
  );

  if (summary.warnings.length > 0) {
    console.log("\nWarnings:");
    for (const warning of summary.warnings.slice(0, 20)) {
      console.log(`  - ${warning}`);
    }
    if (summary.warnings.length > 20) {
      console.log(`  ... +${summary.warnings.length - 20} more`);
    }
  }

  if (summary.errors > 0) {
    process.exit(1);
  }
}

function getRequiredFileArg(args: string[], command: string): string {
  const file = args[0];
  if (!file) {
    console.error(`Uso: ${command} <arquivo>`);
    process.exit(1);
  }
  return file;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
