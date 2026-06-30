/**
 * Script that reads plugin manifest $schema URLs, fetches the JSON Schemas,
 * and generates Zod schema files.
 *
 * Usage: pnpm --filter @lite-llm/agent-plugins generate:plugin-schemas
 */

import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { registeredPluginSchemas } from "../src/lib/plugin-schemas";
import { generatePluginSchema } from "../src/lib/schema-generator";

const PACKAGE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const execFileAsync = promisify(execFile);

for (const spec of registeredPluginSchemas) {
  await generatePluginSchema(spec);
}

const generatedSchemaFiles = registeredPluginSchemas.map(
  (spec) => spec.generatedSchemaPath,
);

await execFileAsync(
  "pnpm",
  ["exec", "biome", "format", "--write", ...generatedSchemaFiles],
  { cwd: PACKAGE_ROOT },
);
console.log("[agent-plugins] formatted generated schema files with Biome.");
console.log("\n[agent-plugins] all plugin schemas generated successfully!");
