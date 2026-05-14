import { writeFileSync } from "node:fs";
import { z } from "zod";
import { agentsConfigSchema } from "../repositories/agents-repository/src/schemas/db-config";

const fullSchema = z.toJSONSchema(agentsConfigSchema, { reused: "ref" });

writeFileSync(
  "./@agents/agents.schema.json",
  JSON.stringify(fullSchema, null, 2),
);

console.log("Schema generated at @agents/agents.schema.json");
