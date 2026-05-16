#!/usr/bin/env node
/**
 * Schema Generation Script
 *
 * Generates TypeScript Zod schemas from JSON schemas using z.fromJSONSchema() (Zod v4).
 * Run with: pnpm --filter @lite-llm/agents-manager generate:schemas
 *
 * This script processes JSON schemas from each plugin's schemas/ directory and
 * generates corresponding Zod schemas in each plugin's schemas/generated/ directory.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

interface PluginSchemaMapping {
  pluginDir: string;
  schemaVar: string;
  typeName: string;
}

const pluginMappings: PluginSchemaMapping[] = [
  { pluginDir: "opencode", schemaVar: "openCodeSchema", typeName: "OpenCode" },
  { pluginDir: "openagent", schemaVar: "openAgentSchema", typeName: "OpenAgent" },
  { pluginDir: "vscode", schemaVar: "vsCodeSchema", typeName: "VsCode" },
];

console.log("Schema Generator using z.fromJSONSchema() (Zod v4)\n");

for (const mapping of pluginMappings) {
  const pluginSchemaDir = path.join(rootDir, "src/plugins", mapping.pluginDir, "schemas");
  const schemaPath = path.join(pluginSchemaDir, `${mapping.pluginDir}.schema.json`);
  const outputDir = path.join(pluginSchemaDir, "generated");
  const outputFile = path.join(outputDir, `${mapping.pluginDir}.zod.ts`);

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));

  console.log(`Processing: ${mapping.pluginDir}/${mapping.pluginDir}.schema.json`);

  // Generate Zod schema code using z.fromJSONSchema
  const outputContent = `/**
 * Auto-generated Zod schema from ${mapping.pluginDir}.schema.json
 * DO NOT EDIT MANUALLY - Regenerate with: pnpm generate:schemas
 * Generated using z.fromJSONSchema() from Zod v4
 */

import { z } from "zod";

// Re-export the schema directly from JSON using z.fromJSONSchema
export const ${mapping.schemaVar} = z.fromJSONSchema(${JSON.stringify(schema, null, 2)} as const);
export type ${mapping.typeName} = z.infer<typeof ${mapping.schemaVar}>;
`;

  fs.writeFileSync(outputFile, outputContent, "utf-8");
  console.log(`  ✓ Generated: ${mapping.pluginDir}/schemas/generated/${mapping.pluginDir}.zod.ts`);
}

console.log(
  `\nGenerated ${pluginMappings.length} Zod schema(s) across plugin directories`,
);
