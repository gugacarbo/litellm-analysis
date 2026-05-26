import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RegisteredPluginSchema } from "./plugin-schemas";

const PACKAGE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

function resolveSpecPath(specPath: string): string {
  if (path.isAbsolute(specPath)) {
    return specPath;
  }
  return path.resolve(PACKAGE_ROOT, specPath);
}

function buildGeneratedSchemaSource(
  pluginId: string,
  schemaObject: unknown,
): string {
  const varName = `${pluginId.replace(/[-_](.)/g, (_, c: string) => c.toUpperCase())}Schema`;
  const typeName = `${varName.charAt(0).toUpperCase()}${varName.slice(1)}Type`;

  return [
    "/**",
    ` * Auto-generated Zod schema for plugin "${pluginId}".`,
    " * DO NOT EDIT MANUALLY - Regenerate with: pnpm --filter @lite-llm/agent-plugins generate:plugin-schemas",
    " */",
    "",
    'import { z } from "zod";',
    "",
    `export const ${varName} = z.fromJSONSchema(${JSON.stringify(schemaObject, null, 2)} as const);`,
    `export type ${typeName} = z.infer<typeof ${varName}>;`,
    "",
  ].join("\n");
}

export async function generatePluginSchema(
  spec: RegisteredPluginSchema,
): Promise<void> {
  const jsonSchemaPath = resolveSpecPath(spec.jsonSchemaPath);
  const generatedSchemaPath = resolveSpecPath(spec.generatedSchemaPath);
  const raw = await readFile(jsonSchemaPath, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  const source = buildGeneratedSchemaSource(spec.pluginId, parsed);

  const dir = path.dirname(generatedSchemaPath);
  await mkdir(dir, { recursive: true });
  await writeFile(generatedSchemaPath, source, "utf-8");
}

export async function shouldGeneratePluginSchema(
  spec: RegisteredPluginSchema,
): Promise<boolean> {
  try {
    const jsonSchemaPath = resolveSpecPath(spec.jsonSchemaPath);
    const generatedSchemaPath = resolveSpecPath(spec.generatedSchemaPath);
    const [jsonStat, generatedStat] = await Promise.all([
      stat(jsonSchemaPath),
      stat(generatedSchemaPath),
    ]);

    return jsonStat.mtimeMs > generatedStat.mtimeMs;
  } catch {
    return true;
  }
}
