import { sql } from "drizzle-orm";
import { queryRaw } from "./client";

export async function rawQuery<T>(
  queryString: string,
  params: unknown[] = [],
): Promise<T[]> {
  return queryRaw<T>(sql.raw(queryString), params);
}
