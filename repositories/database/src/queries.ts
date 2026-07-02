import { db, queryRaw } from "./client";
import { sql } from "drizzle-orm";

export async function rawQuery<T>(queryString: string, params: unknown[] = []): Promise<T[]> {
  return queryRaw<T>(sql.raw(queryString), params);
}
