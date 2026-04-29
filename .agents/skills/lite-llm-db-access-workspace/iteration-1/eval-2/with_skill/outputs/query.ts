import { db, schema } from "@lite-llm/analytics/queries";
import { eq, sum } from "drizzle-orm";

export async function getActiveApisAndGpt4oBalance() {
  const activeApis = await db
    .selectDistinct({
      apiBase: schema.spendLogs.apiBase,
    })
    .from(schema.spendLogs);

  const gpt4oBalance = await db
    .select({
      totalSpend: sum(schema.spendLogs.spend),
    })
    .from(schema.spendLogs)
    .where(eq(schema.spendLogs.model, "gpt-4o"));

  return {
    activeApis,
    gpt4oBalance: gpt4oBalance[0]?.totalSpend || 0,
  };
}
