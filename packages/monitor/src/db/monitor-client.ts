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
      status_code INTEGER,
      prompt_sent TEXT NOT NULL,
      response_received TEXT,
      error_message TEXT,
      source TEXT NOT NULL DEFAULT 'scheduled',
      checked_at INTEGER NOT NULL
    )
  `);

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
