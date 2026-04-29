import { desc, isNotNull } from "drizzle-orm";
import { db, schema } from "./packages/analytics/src/queries/index.js";

async function run() {
  const [log] = await db
    .select({
      requestId: schema.spendLogs.requestId,
      messages: schema.spendLogs.messages,
      response: schema.spendLogs.response,
    })
    .from(schema.spendLogs)
    .where(isNotNull(schema.spendLogs.messages))
    .orderBy(desc(schema.spendLogs.startTime))
    .limit(1);
  console.log(JSON.stringify(log, null, 2));
  process.exit(0);
}
run();
