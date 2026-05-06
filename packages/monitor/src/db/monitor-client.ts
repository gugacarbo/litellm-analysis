import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./monitor-schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "db",
  "monitor.db",
);

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
    sqlite.exec("ALTER TABLE model_health_checks ADD COLUMN output_tokens INTEGER");
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
    CREATE INDEX IF NOT EXISTS idx_health_checks_model_checked
    ON model_health_checks(model_name, checked_at DESC)
  `);

  return drizzle(sqlite, { schema });
}

export function getMonitorDb(): ReturnType<typeof drizzle> {
  if (!dbInstance) {
    dbInstance = initDb();
  }
  return dbInstance;
}

export type MonitorDb = ReturnType<typeof drizzle>;
