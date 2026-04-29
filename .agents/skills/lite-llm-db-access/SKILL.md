---
name: lite-llm-db-access
description: How to access the LiteLLM PostgreSQL database, query tables using Drizzle ORM, understand schema structures, and maintain a local cache of table schemas and example records. Make sure to use this skill whenever the user asks to query the database, explore table schemas, fetch data from LiteLLM tables, or update database documentation.
---

# LiteLLM Database Access Skill

This skill helps you understand how to access the `lite-llm-analytics` database, extract schema definitions, run queries to see what's actually stored in the tables, and maintain a local reference of these schemas and sample records.

## Database Context

- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Location**: Database logic lives entirely within `packages/analytics/src/queries/`.
- **Client**: `import { db, schema } from "@lite-llm/analytics/queries"`
- **Architecture**: Always respect the Strategy Pattern (`AnalyticsDataSource`). You shouldn't call Drizzle queries directly from HTTP routes (`apps/server/src/api-server.ts`); they should be accessed via `DatabaseDataSource` (`packages/analytics/src/data-source/database.ts`).

### Schema Definitions

The Drizzle schemas are defined in `packages/analytics/src/queries/schema.ts`. Note the naming convention difference:
- Database columns use **snake_case** (e.g., `total_tokens`, `call_type`).
- Drizzle exposes them to TypeScript as **camelCase** (e.g., `totalTokens`, `callType`).

## Query Examples

To query the database when developing new features or performing data analysis, follow this pattern:

```typescript
import { db, schema } from "@lite-llm/analytics/queries";
import { eq, desc, sum } from "drizzle-orm";

// Example: Fetching 5 recent spend logs
const recentLogs = await db
  .select()
  .from(schema.spendLogs)
  .orderBy(desc(schema.spendLogs.startTime))
  .limit(5);

// Example: Calculating total spend per model
const spendByModel = await db
  .select({
    model: schema.spendLogs.model,
    totalSpend: sum(schema.spendLogs.spend),
  })
  .from(schema.spendLogs)
  .groupBy(schema.spendLogs.model);
```

## 🚨 MANDATORY ACTION: Table Caching

Every single time you access, inspect, or query a database table during a conversation, you MUST update the local cache inside this skill's folder (`.agents/skills/lite-llm-db-access/tables/`) to match the latest reality. These files are used as a quick reference, but you must always acknowledge that the true values change and checking the live database is the only way to be 100% certain.

### 1. The Index File
Ensure `.agents/skills/lite-llm-db-access/tables/tables.md` is updated with a link and a brief description of the table you just explored.

**Format for `tables.md`:**
```markdown
# Database Tables Index

| Table Name | Description                                         | Reference                      |
| ---------- | --------------------------------------------------- | ------------------------------ |
| spendLogs  | Stores all LLM API request logs, cost, and latency. | [spendLogs.md](./spendLogs.md) |
```

### 2. The Table Reference File
Create or overwrite `.agents/skills/lite-llm-db-access/tables/<tableName>.md` with the latest schema details and an actual JSON example of a record fetched directly from the DB.

**Format for `<tableName>.md`:**
```markdown
# Table: [Table Name]

> **Note:** This is a cached reference. Data changes frequently in the live database. Always run a query if exact real-time precision is needed.

## Schema Sketch
(List the camelCase typescript fields and their DB snake_case mappings, types, and constraints)

- `requestId`: varchar (PK)
- `model`: varchar (NotNull)

## Example Record
(Provide a JSON snippet of 1 real record queried from the DB to show exact data formats)

\`\`\`json
{
  "requestId": "req_12345",
  "model": "gpt-4-turbo",
  "totalTokens": 142
}
\`\`\`
```

### When to trigger this caching rule?
- If the user asks "what's in the spendLogs table?" or "how are models stored?".
- If you run an ad-hoc query to investigate table structure.
- If you modify `schema.ts`.
