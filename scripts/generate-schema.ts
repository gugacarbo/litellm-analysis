import { writeFileSync } from "node:fs";
import { z } from "zod";
import { dbConfigSchema } from "../repositories/agents-repository/src/schemas/db-config";

const fullSchema = z.toJSONSchema(dbConfigSchema, { reused: "ref" });

writeFileSync(
  "./@agents/agents.schema.json",
  JSON.stringify(fullSchema, null, 2),
);

console.log("Schema generated at @agents/agents.schema.json");
