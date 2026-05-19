import { writeFileSync } from "node:fs";
import { z } from "zod";
import { agentsConfigSchema } from "../../repositories/agents-repository/src/schemas/db-config";
import { pluginsConfigSchema } from "../../repositories/agents-repository/src/schemas/plugins-config";
import { modelsConfigSchema } from "../../repositories/models-repository/src/schemas";

const agentsSchemaOutputPath =
  process.env.AGENTS_SCHEMA_OUTPUT_PATH ??
  "./@settings/agents/agents.schema.json";

const pluginsSchemaOutputPath =
  process.env.PLUGINS_SCHEMA_OUTPUT_PATH ??
  "./@settings/plugins/plugins.schema.json";

const modelsSchemaOutputPath =
  process.env.MODELS_SCHEMA_OUTPUT_PATH ??
  "./@settings/models/models.schema.json";

function generateSchema(schema: z.ZodType, outputPath: string): void {
  const fullSchema = z.toJSONSchema(schema, { reused: "ref" });

  writeFileSync(outputPath, JSON.stringify(fullSchema, null, 2));
  console.log(`Schema generated at ${outputPath}`);
}

generateSchema(agentsConfigSchema, agentsSchemaOutputPath);
generateSchema(pluginsConfigSchema, pluginsSchemaOutputPath);
generateSchema(modelsConfigSchema, modelsSchemaOutputPath);