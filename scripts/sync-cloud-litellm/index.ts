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
 *   3. import  → lê o JSON e insere no PostgreSQL local
 *
 * Variáveis de ambiente:
 *   LITELLM_CLOUD_URL       (obrigatório no fetch) URL base do LiteLLM cloud
 *   LITELLM_CLOUD_API_KEY   (obrigatório no fetch) API key do LiteLLM cloud
 *   DB_PASSWORD             (obrigatório no import) senha do PostgreSQL local
 *   DB_HOST                 (default: localhost)
 *   DB_PORT                 (default: 5432)
 *   DB_NAME                 (default: litellm)
 *   DB_USER                 (default: llmproxy)
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

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

  import <arquivo>
    Importa o JSON para o PostgreSQL local usando a tabela LiteLLM_SpendLogs.

    Env:
      DB_PASSWORD   (obrigatório)
      DB_HOST       (default: localhost)
      DB_PORT       (default: 5432)
      DB_NAME       (default: litellm)
      DB_USER       (default: llmproxy)

    Exemplo:
      DB_PASSWORD=minha-senha \
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

interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

function getDbConfig(): DbConfig {
  const host = process.env.DB_HOST ?? "localhost";
  const port = Number.parseInt(process.env.DB_PORT ?? "5432", 10);
  const user = process.env.DB_USER ?? "llmproxy";
  const database = process.env.DB_NAME ?? "litellm";
  const password = process.env.DB_PASSWORD;

  if (!password) {
    console.error("ERRO: DB_PASSWORD não definida");
    process.exit(1);
  }

  return { host, port, user, password, database };
}

async function cmdImport(args: string[]): Promise<void> {
  const file = getRequiredFileArg(args, "import");
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

  const db = getDbConfig();
  const client = new Client(db);
  await client.connect();

  try {
    await client.query("BEGIN");

    let imported = 0;
    for (const rawLog of logs) {
      const log = rawLog as Record<string, unknown>;
      const requestId = String(log.request_id ?? "");
      if (!requestId) {
        continue;
      }

      await client.query(
        `
          INSERT INTO "LiteLLM_SpendLogs" (
            "request_id", "call_type", "api_key", "spend", "total_tokens",
            "prompt_tokens", "completion_tokens", "startTime", "endTime",
            "request_duration_ms", "completionStartTime", "model", "model_id",
            "model_group", "custom_llm_provider", "api_base", "user",
            "metadata", "cache_hit", "cache_key", "request_tags", "team_id",
            "organization_id", "end_user", "requester_ip_address", "messages",
            "response", "session_id", "status", "mcp_namespaced_tool_name",
            "agent_id", "proxy_server_request"
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            $10, $11, $12, $13,
            $14, $15, $16, $17,
            $18, $19, $20, $21, $22,
            $23, $24, $25, $26,
            $27, $28, $29, $30,
            $31, $32
          )
          ON CONFLICT ("request_id") DO NOTHING
        `,
        [
          requestId,
          String(log.call_type ?? ""),
          String(log.api_key ?? ""),
          Number(log.spend ?? 0),
          Number(log.total_tokens ?? 0),
          Number(log.prompt_tokens ?? 0),
          Number(log.completion_tokens ?? 0),
          toDate(log.startTime) ?? new Date(0),
          toDate(log.endTime) ?? new Date(0),
          toIntOrNull(log.request_duration_ms),
          toDate(log.completionStartTime),
          String(log.model ?? ""),
          toStringOrNull(log.model_id),
          toStringOrNull(log.model_group),
          toStringOrNull(log.custom_llm_provider),
          toStringOrNull(log.api_base),
          toStringOrNull(log.user),
          toJsonValue(log.metadata, "{}"),
          toStringOrNull(log.cache_hit),
          toStringOrNull(log.cache_key),
          toJsonValue(log.request_tags, "[]"),
          toStringOrNull(log.team_id),
          toStringOrNull(log.organization_id),
          toStringOrNull(log.end_user),
          toStringOrNull(log.requester_ip_address),
          toJsonValue(log.messages, "{}"),
          toJsonValue(log.response, "{}"),
          toStringOrNull(log.session_id),
          toStringOrNull(log.status),
          toStringOrNull(log.mcp_namespaced_tool_name),
          toStringOrNull(log.agent_id),
          toJsonValue(log.proxy_server_request, "{}"),
        ],
      );

      imported += 1;
      if (imported % 500 === 0) {
        console.log(`   ✅  ${imported}/${logs.length} processados`);
      }
    }

    await client.query("COMMIT");
    console.log(`✅  Import finalizado. Registros processados: ${imported}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
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

function toStringOrNull(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }
  if (value === null || value === undefined) {
    return null;
  }
  return String(value);
}

function toIntOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : null;
}

function toDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toJsonValue(value: unknown, fallback: string): unknown {
  if (value === null || value === undefined) {
    return JSON.parse(fallback);
  }
  return value;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
