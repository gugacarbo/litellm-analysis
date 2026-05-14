import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { agentsConfigSchema } from "../src/schemas/db-config.ts";
import { pluginsConfigSchema } from "../src/schemas/plugins-config.ts";

function generateSchema(schema: z.ZodType, outputPath: string): void {
  const jsonSchema = z.toJSONSchema(schema);

  // Downgrade $schema URI to draft-07 for AJV compatibility
  if (jsonSchema.$schema) {
    jsonSchema.$schema = "http://json-schema.org/draft-07/schema#";
  }

  const output = `${JSON.stringify(jsonSchema, null, 2)}
`;

  writeFileSync(outputPath, output, "utf-8");
  console.log("Written:", outputPath);
}

// Generate agents schema (without plugins)
const agentsSchemaPath = resolve(
  import.meta.dirname,
  "../../../@agents/agents.schema.json",
);
generateSchema(agentsConfigSchema, agentsSchemaPath);

// Generate plugins schema
const pluginsSchemaPath = resolve(
  import.meta.dirname,
  "../../../@agents/plugins.schema.json",
);
generateSchema(pluginsConfigSchema, pluginsSchemaPath);