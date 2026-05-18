import * as fs from "node:fs";
import { existsSync } from "node:fs";
import * as path from "node:path";
import { serverEnv } from "@lite-llm/config/server";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

function findMonorepoRoot(): string {
  let dir = process.cwd();
  const root = path.parse(dir).root;

  while (dir !== root) {
    const workspacePath = path.join(dir, "pnpm-workspace.yaml");
    if (existsSync(workspacePath)) {
      return dir;
    }
    dir = path.dirname(dir);
  }

  // Fallback
  return process.cwd();
}

const MONOREPO_ROOT = findMonorepoRoot();
const APP_DB_PATH = serverEnv.APP_DB_PATH;
const DB_PATH = path.resolve(MONOREPO_ROOT, APP_DB_PATH);

let dbInstance: ReturnType<typeof drizzle> | null = null;

function ensureHealthCheckColumns(sqlite: InstanceType<typeof Database>): void {
  const columns = sqlite
    .prepare("PRAGMA table_info(model_health_checks)")
    .all() as Array<{ name: string }>;
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has("ttft_ms")) {
    sqlite.exec("ALTER TABLE model_health_checks ADD COLUMN ttft_ms INTEGER");
  }
  if (!columnNames.has("tokens_per_second")) {
    sqlite.exec(
      "ALTER TABLE model_health_checks ADD COLUMN tokens_per_second REAL",
    );
  }
  if (!columnNames.has("output_tokens")) {
    sqlite.exec(
      "ALTER TABLE model_health_checks ADD COLUMN output_tokens INTEGER",
    );
  }
  if (!columnNames.has("request_payload")) {
    sqlite.exec(
      "ALTER TABLE model_health_checks ADD COLUMN request_payload TEXT",
    );
  }
  if (!columnNames.has("response_payload")) {
    sqlite.exec(
      "ALTER TABLE model_health_checks ADD COLUMN response_payload TEXT",
    );
  }
}

function initDb(): ReturnType<typeof drizzle> {
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const sqlite = new Database(DB_PATH);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anomaly_type TEXT NOT NULL,
      model TEXT,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      metadata TEXT,
      detected_at INTEGER NOT NULL,
      acknowledged_at INTEGER,
      created_at INTEGER NOT NULL
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS alert_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      anomaly_type TEXT NOT NULL,
      threshold_config TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      cooldown_seconds INTEGER NOT NULL DEFAULT 300,
      created_at INTEGER NOT NULL
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS model_health_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_name TEXT NOT NULL,
      status TEXT NOT NULL,
      response_time_ms INTEGER,
      ttft_ms INTEGER,
      output_tokens INTEGER,
      tokens_per_second REAL,
      status_code INTEGER,
      prompt_sent TEXT NOT NULL,
      response_received TEXT,
      request_payload TEXT,
      response_payload TEXT,
      error_message TEXT,
      source TEXT NOT NULL DEFAULT 'scheduled',
      checked_at INTEGER NOT NULL
    )
  `);
  ensureHealthCheckColumns(sqlite);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS prompt_eval_runs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      model TEXT NOT NULL,
      macro_f1 REAL,
      threshold REAL NOT NULL,
      error TEXT,
      started_at INTEGER NOT NULL,
      finished_at INTEGER
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS prompt_eval_run_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id TEXT NOT NULL REFERENCES prompt_eval_runs(id),
      step TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      finished_at INTEGER,
      message TEXT,
      progress_pct INTEGER NOT NULL DEFAULT 0
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS prompt_eval_run_artifacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id TEXT NOT NULL REFERENCES prompt_eval_runs(id),
      kind TEXT NOT NULL,
      path TEXT NOT NULL,
      summary_json TEXT
    )
  `);

  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_health_checks_model_checked
    ON model_health_checks(model_name, checked_at DESC)
  `);

  return drizzle(sqlite, { schema });
}

export function getAppDb(): ReturnType<typeof drizzle> {
  if (!dbInstance) {
    dbInstance = initDb();
  }
  return dbInstance;
}

export type AppDb = ReturnType<typeof drizzle>;
