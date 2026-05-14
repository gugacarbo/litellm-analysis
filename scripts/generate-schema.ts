import { writeFileSync } from "node:fs";
import { z } from "zod";
import { agentsConfigSchema } from "../repositories/agents-repository/src/schemas/db-config";
import { pluginsConfigSchema } from "../repositories/agents-repository/src/schemas/plugins-config";

function generateSchema(schema: z.ZodType, outputPath: string): void {
  const fullSchema = z.toJSONSchema(schema, { reused: "ref" });

  writeFileSync(outputPath, JSON.stringify(fullSchema, null, 2));
  console.log(`Schema generated at ${outputPath}`);
}

generateSchema(
  agentsConfigSchema,
  "./@agents/agents.schema.json",
);
generateSchema(
  pluginsConfigSchema,
  "./@agents/plugins.schema.json",
);