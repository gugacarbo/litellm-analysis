#!/usr/bin/env node
/**
 * Schema Generation Script
 *
 * Generates TypeScript Zod schemas from JSON schemas using z.fromJSONSchema() (Zod v4).
 * Run with: pnpm --filter @lite-llm/agents-manager generate:schemas
 *
 * This script processes all JSON schemas in src/plugins/schemas/ and generates
 * corresponding Zod schemas in src/plugins/schemas/generated/.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const SCHEMAS_DIR = path.join(rootDir, "src/plugins/schemas");
const OUTPUT_DIR = path.join(SCHEMAS_DIR, "generated");

interface SchemaMapping {
  inputFile: string;
  outputFile: string;
  schemaVar: string;
  typeName: string;
}

const schemaMappings: SchemaMapping[] = [
  {
    inputFile: "opencode.schema.json",
    outputFile: "opencode.zod.ts",
    schemaVar: "openCodeSchema",
    typeName: "OpenCode",
  },
  {
    inputFile: "openagent.schema.json",
    outputFile: "openagent.zod.ts",
    schemaVar: "openAgentSchema",
    typeName: "OpenAgent",
  },
  {
    inputFile: "vscode.schema.json",
    outputFile: "vscode.zod.ts",
    schemaVar: "vsCodeSchema",
    typeName: "VsCode",
  },
];

console.log("Schema Generator using z.fromJSONSchema() (Zod v4)\n");

// Ensure output directory exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (const mapping of schemaMappings) {
  const schemaPath = path.join(SCHEMAS_DIR, mapping.inputFile);
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));

  const outputFile = path.join(OUTPUT_DIR, mapping.outputFile);

  console.log(`Processing: ${mapping.inputFile}`);

  // Generate Zod schema code using z.fromJSONSchema
  const outputContent = `/**
 * Auto-generated Zod schema from ${mapping.inputFile}
 * DO NOT EDIT MANUALLY - Regenerate with: pnpm generate:schemas
 * Generated using z.fromJSONSchema() from Zod v4
 */

import { z } from "zod";

// Re-export the schema directly from JSON using z.fromJSONSchema
export const ${mapping.schemaVar} = z.fromJSONSchema(${JSON.stringify(schema, null, 2)} as const);
export type ${mapping.typeName} = z.infer<typeof ${mapping.schemaVar}>;
`;

  fs.writeFileSync(outputFile, outputContent, "utf-8");
  console.log(`  ✓ Generated: ${mapping.outputFile}`);
}

// Update index.ts
const indexContent = `/**
 * Auto-generated schema exports
 * DO NOT EDIT MANUALLY
 */

export { openCodeSchema, type OpenCode } from "./opencode.zod.js";
export { openAgentSchema, type OpenAgent } from "./openagent.zod.js";
export { vsCodeSchema, type VsCode } from "./vscode.zod.js";
`;

fs.writeFileSync(path.join(OUTPUT_DIR, "index.ts"), indexContent, "utf-8");
console.log("\n✓ Updated: index.ts");

console.log(
  `\nGenerated ${schemaMappings.length} Zod schema(s) in ${OUTPUT_DIR}`,
);
