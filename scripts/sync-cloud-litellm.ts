#!/usr/bin/env tsx
/**
 * sync-cloud-litellm.ts
 *
 * Sincroniza dados de um LiteLLM cloud para o banco PostgreSQL local.
 *
 * Uso:
 *   pnpm tsx scripts/sync-cloud-litellm.ts fetch [opções]
 *   pnpm tsx scripts/sync-cloud-litellm.ts stats <arquivo>
 *   pnpm tsx scripts/sync-cloud-litellm.ts import <arquivo>
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
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
      LITELLM_CLOUD_URL=https://meu-litellm.cloud.com \\
        LITELLM_CLOUD_API_KEY=sk-... \\
        pnpm tsx scripts/sync-cloud-litellm.ts fetch --days 90

  stats <arquivo>
    Mostra estatísticas básicas do JSON baixado.

    Exemplo:
      pnpm tsx scripts/sync-cloud-litellm.ts stats @storage/output/cloud-sync/spend-logs.json

  import <arquivo>
    Importa o JSON para o PostgreSQL local usando a tabela LiteLLM_SpendLogs.

    Env:
      DB_PASSWORD   (obrigatório)
      DB_HOST       (default: localhost)
      DB_PORT       (default: 5432)
      DB_NAME       (default: litellm)
      DB_USER       (default: llmproxy)

    Exemplo:
      DB_PASSWORD=minha-senha \\
        pnpm tsx scripts/sync-cloud-litellm.ts import @storage/output/cloud-sync/spend-logs.json
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
    const models = new Set(logs.map((l: Record<string, unknown>) => l.model));
    const totalSpend = logs.reduce(
      (acc: number, l: Record<string, unknown>) =>
        acc + (typeof l.spend === "number" ? l.spend : Number(l.spend) || 0),
      0,
    );
    const totalTokens = logs.reduce(
      (acc: number, l: Record<string, unknown>) =>
        acc +
        (typeof l.total_tokens === "number"
          ? l.total_tokens
          : Number(l.total_tokens) || 0),
      0,
    );
    const dates = logs
      .map((l: Record<string, unknown>) => l.startTime as string)
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
  let totalFetched = 0;

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

    if (items.length === 0) break;

    allLogs.push(...items);
    totalFetched += items.length;
    console.log(`      → ${totalFetched} registros até agora`);

    // Se veio menos que o page size, é a última página
    if (items.length < PAGE_SIZE) break;

    page++;

    // Pequena pausa para não sobrecarregar a API
    await sleep(200);
  }

  return allLogs;
}

// ─── Stats ───────────────────────────────────────────────────────────────────

async function cmdStats(args: string[]): Promise<void> {
  const filePath = resolveFileArg(args);
  const content = await readFile(filePath, "utf-8");
  const data = JSON.parse(content);

  let logs: unknown[];
  if (Array.isArray(data)) {
    logs = data;
  } else if (data && Array.isArray((data as Record<string, unknown>).logs)) {
    logs = (data as Record<string, unknown>).logs as unknown[];
  } else {
    console.error(
      "Formato de arquivo não reconhecido. Esperado array ou { logs: [...] }",
    );
    process.exit(1);
  }

  if (logs.length === 0) {
    console.log("📭  Nenhum registro encontrado.");
    return;
  }

  const models = new Map<string, number>();
  const providers = new Map<string, number>();
  let totalSpend = 0;
  let totalTokens = 0;
  let totalRequests = 0;
  let dates: string[] = [];
  let errors = 0;

  for (const log of logs) {
    const l = log as Record<string, unknown>;
    const model = String(l.model ?? l.model_group ?? "?");
    const provider = String(l.custom_llm_provider ?? "?");
    const spend = Number(l.spend) || 0;
    const tokens = Number(l.total_tokens) || 0;
    const status = String(l.status ?? "");

    models.set(model, (models.get(model) ?? 0) + 1);
    providers.set(provider, (providers.get(provider) ?? 0) + 1);
    totalSpend += spend;
    totalTokens += tokens;
    totalRequests++;
    if (l.startTime) dates.push(String(l.startTime));
    if (status !== "success" && status !== "" && !status.includes("200")) {
      errors++;
    }
  }

  dates = dates.sort();
  const from = dates[0] ?? "?";
  const to = dates[dates.length - 1] ?? "?";

  console.log("");
  console.log("📊  STATS — Cloud Sync");
  console.log("━".repeat(40));
  console.log(`   Registros:     ${totalRequests.toLocaleString()}`);
  console.log(`   Modelos:       ${models.size}`);
  console.log(`   Providers:     ${providers.size}`);
  console.log(`   Período:       ${from.slice(0, 10)} → ${to.slice(0, 10)}`);
  console.log(`   Total spend:   $${totalSpend.toFixed(4)}`);
  console.log(`   Total tokens:  ${totalTokens.toLocaleString()}`);
  console.log(`   Erros:         ${errors}`);
  console.log("");
  console.log("📋  Top modelos:");
  const sortedModels = [...models.entries()].sort((a, b) => b[1] - a[1]);
  for (const [model, count] of sortedModels.slice(0, 10)) {
    console.log(`   ${model.padEnd(40)} ${String(count).padStart(6)} req`);
  }
  if (sortedModels.length > 10) {
    console.log(`   ... e mais ${sortedModels.length - 10} modelos`);
  }
}

// ─── Import ──────────────────────────────────────────────────────────────────

async function cmdImport(args: string[]): Promise<void> {
  const filePath = resolveFileArg(args);

  const dbPassword = process.env.DB_PASSWORD;
  if (!dbPassword) {
    console.error("ERRO: DB_PASSWORD não definida");
    process.exit(1);
  }

  // Lê o JSON
  const content = await readFile(filePath, "utf-8");
  const data = JSON.parse(content);

  let logs: Record<string, unknown>[];
  if (Array.isArray(data)) {
    logs = data as Record<string, unknown>[];
  } else if (data && Array.isArray((data as Record<string, unknown>).logs)) {
    logs = (data as Record<string, unknown>).logs as Record<string, unknown>[];
  } else {
    console.error(
      "Formato de arquivo não reconhecido. Esperado array ou { logs: [...] }",
    );
    process.exit(1);
  }

  console.log(`📦  ${logs.length} registros para importar`);
  if (logs.length === 0) {
    console.log("Nada a importar.");
    return;
  }

  // Importa usando pg (carregado dinamicamente)
  const { default: pg } = await import("pg");
  const pool = new pg.Pool({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME ?? "litellm",
    user: process.env.DB_USER ?? "llmproxy",
    password: dbPassword,
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });

  const client = await pool.connect();

  try {
    // Verifica se a tabela existe
    const tableCheck = await client.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'LiteLLM_SpendLogs'
      )`,
    );
    if (!tableCheck.rows[0].exists) {
      console.error(
        "ERRO: Tabela LiteLLM_SpendLogs não existe no banco local.",
      );
      console.error(
        "Certifique-se de que o LiteLLM local já rodou as migrações.",
      );
      return;
    }

    // Desativa trigger de atualização automática se existir (evita lentidão)
    await client.query("SET session_replication_role = 'replica'").catch(() => {
      /* pode falhar sem permissão, ignorar */
    });

    let inserted = 0;
    let skipped = 0;
    let errors_count = 0;
    const batchSize = 500;

    for (let i = 0; i < logs.length; i += batchSize) {
      const batch = logs.slice(i, i + batchSize);

      for (const log of batch) {
        // Mapeia os campos do JSON da API LiteLLM para os nomes de coluna do DB
        // A API retorna os nomes de coluna do DB diretamente (snake_case e camelCase)
        const cols: string[] = [];
        const vals: unknown[] = [];
        const placeholders: string[] = [];
        let idx = 1;

        function push(col: string, val: unknown): void {
          // Pula null/undefined (colunas opcionais)
          if (val === null || val === undefined) return;
          cols.push(`"${col}"`);
          vals.push(val);
          placeholders.push(`$${idx++}`);
        }

        // request_id (PK, obrigatório)
        const reqId = log.request_id ?? log.requestId;
        if (!reqId) {
          errors_count++;
          continue;
        }
        cols.push('"request_id"');
        vals.push(reqId);
        placeholders.push(`$${idx++}`);

        push("model", log.model);
        push("call_type", log.call_type ?? log.callType);
        push("api_base", log.api_base ?? log.apiBase);
        push("user", log.user);
        push("team_id", log.team_id ?? log.teamId);
        push("end_user", log.end_user ?? log.endUser);
        push("organization_id", log.organization_id ?? log.organizationId);
        push("total_tokens", toInt(log.total_tokens ?? log.totalTokens));
        push("prompt_tokens", toInt(log.prompt_tokens ?? log.promptTokens));
        push(
          "completion_tokens",
          toInt(log.completion_tokens ?? log.completionTokens),
        );
        push("spend", toFloat(log.spend));
        push("startTime", log.startTime);
        push("endTime", log.endTime);
        push("completionStartTime", log.completionStartTime);
        push(
          "request_duration_ms",
          toInt(log.request_duration_ms ?? log.requestDurationMs),
        );
        push("api_key", log.api_key ?? log.apiKey);
        push("status", log.status);
        push("cache_hit", log.cache_hit ?? log.cacheHit);
        push("cache_key", log.cache_key ?? log.cacheKey);
        push("metadata", log.metadata ? JSON.stringify(log.metadata) : null);
        push(
          "proxy_server_request",
          (log.proxy_server_request ?? log.proxyServerRequest)
            ? JSON.stringify(log.proxy_server_request ?? log.proxyServerRequest)
            : null,
        );
        push("response", log.response ? JSON.stringify(log.response) : null);
        push(
          "request_tags",
          (log.request_tags ?? log.requestTags)
            ? JSON.stringify(log.request_tags ?? log.requestTags)
            : null,
        );
        push(
          "requester_ip_address",
          log.requester_ip_address ?? log.requesterIpAddress,
        );
        push("session_id", log.session_id ?? log.sessionId);
        push("agent_id", log.agent_id ?? log.agentId);
        push("model_id", log.model_id ?? log.modelId);
        push("model_group", log.model_group ?? log.modelGroup);
        push(
          "custom_llm_provider",
          log.custom_llm_provider ?? log.customLlmProvider,
        );
        push(
          "mcp_namespaced_tool_name",
          log.mcp_namespaced_tool_name ?? log.mcpNamespacedToolName,
        );
        push("messages", log.messages ? JSON.stringify(log.messages) : null);

        const sql = `INSERT INTO "LiteLLM_SpendLogs" (${cols.join(", ")})
                     VALUES (${placeholders.join(", ")})
                     ON CONFLICT (request_id) DO NOTHING`;

        try {
          const result = await client.query(sql, vals);
          if ((result.rowCount ?? 0) > 0) {
            inserted++;
          } else {
            skipped++;
          }
        } catch (err) {
          errors_count++;
          if (errors_count <= 5) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`   ⚠  Erro ao inserir ${reqId}: ${msg}`);
          }
        }
      }

      const pct = Math.min(
        100,
        Math.round(((i + batchSize) / logs.length) * 100),
      );
      console.log(
        `   📥  ${Math.min(i + batchSize, logs.length)}/${logs.length} (${pct}%) — inseridos: ${inserted}, pulados: ${skipped}, erros: ${errors_count}`,
      );
    }

    // Restaura role
    await client
      .query("SET session_replication_role = 'origin'")
      .catch(() => {});

    console.log("");
    console.log("━".repeat(40));
    console.log(`✅  Importação concluída`);
    console.log(`   Inseridos: ${inserted}`);
    console.log(`   Pulados (duplicatas): ${skipped}`);
    console.log(`   Erros:    ${errors_count}`);
    console.log(`   Total:    ${logs.length}`);
  } finally {
    client.release();
    await pool.end();
  }
}

// ─── Utilitários ─────────────────────────────────────────────────────────────

function resolveFileArg(args: string[]): string {
  if (args.length === 0) {
    console.error("ERRO: Informe o caminho do arquivo JSON");
    process.exit(1);
  }
  return path.resolve(ROOT, args[0]);
}

function toInt(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const n = Number(val);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function toFloat(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

main().catch((error) => {
  console.error(
    `\n❌  ERRO: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
