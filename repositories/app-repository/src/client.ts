import { db, getDb } from "@lite-llm/database/client";

export function getAppDb() {
  return getDb();
}

export type AppDb = ReturnType<typeof getDb>;
