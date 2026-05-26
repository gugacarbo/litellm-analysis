/**
 * Script that reads plugin manifest $schema URLs, fetches the JSON Schemas,
 * and generates plugin.schema.ts files using z.fromJSONSchema().
 *
 * Usage: pnpm --filter @lite-llm/agent-plugins generate:plugin-schemas
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pluginManifests } from "../src/plugins/manifests";

const PACKAGE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const execFileAsync = promisify(execFile);

const PLUGINS_DIR = path.join(PACKAGE_ROOT, "src/plugins");

function buildGeneratedSchemaSource(
  pluginId: string,
  schemaObject: unknown,
): string {
  const varName = `${pluginId.replace(/[-_](.)/g, (_, c: string) => c.toUpperCase())}Schema`;
  const typeName = `${varName.charAt(0).toUpperCase()}${varName.slice(1)}Type`;
  const zodExpr = toZodExpression(schemaObject, schemaObject);

  return [
    "/**",
    ` * Auto-generated Zod schema for plugin "${pluginId}".`,
    " * DO NOT EDIT MANUALLY - Regenerate with: pnpm --filter @lite-llm/agent-plugins generate:plugin-schemas",
    " */",
    "",
    'import { z } from "zod";',
    "",
    `export const ${varName} = ${zodExpr};`,
    `export type ${typeName} = z.infer<typeof ${varName}>;`,
    "",
  ].join("\n");
}

function escapeString(value: string): string {
  return JSON.stringify(value);
}

function resolveJsonPointer(root: unknown, ref: string): unknown {
  if (!ref.startsWith("#/")) return undefined;
  const parts = ref
    .slice(2)
    .split("/")
    .map((p) => p.replace(/~1/g, "/").replace(/~0/g, "~"));
  let cursor: unknown = root;
  for (const part of parts) {
    if (!cursor || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return cursor;
}

function toZodExpression(
  schema: unknown,
  root: unknown,
  stack: Set<unknown> = new Set(),
): string {
  if (!schema || typeof schema !== "object") return "z.any()";
  if (stack.has(schema)) return "z.any()";

  const obj = schema as Record<string, unknown>;
  const ref = obj.$ref;
  if (typeof ref === "string") {
    const resolved = resolveJsonPointer(root, ref);
    if (resolved) {
      const nextStack = new Set(stack);
      nextStack.add(schema);
      return toZodExpression(resolved, root, nextStack);
    }
  }

  const enumValues = obj.enum;
  if (Array.isArray(enumValues) && enumValues.length > 0) {
    if (enumValues.every((item) => typeof item === "string")) {
      return `z.enum([${enumValues.map((item) => escapeString(item)).join(", ")}])`;
    }
    return `z.union([${enumValues
      .map((item) => `z.literal(${JSON.stringify(item)})`)
      .join(", ")}])`;
  }

  const anyOf = obj.anyOf;
  if (Array.isArray(anyOf) && anyOf.length > 0) {
    return `z.union([${anyOf
      .map((item) => toZodExpression(item, root, new Set(stack)))
      .join(", ")}])`;
  }

  const oneOf = obj.oneOf;
  if (Array.isArray(oneOf) && oneOf.length > 0) {
    return `z.union([${oneOf
      .map((item) => toZodExpression(item, root, new Set(stack)))
      .join(", ")}])`;
  }

  const allOf = obj.allOf;
  if (Array.isArray(allOf) && allOf.length > 0) {
    const members = allOf.map((item) =>
      toZodExpression(item, root, new Set(stack)),
    );
    return members
      .slice(1)
      .reduce((acc, cur) => `${acc}.and(${cur})`, members[0] ?? "z.any()");
  }

  const type = obj.type;
  if (type === "string") return "z.string()";
  if (type === "boolean") return "z.boolean()";
  if (type === "number" || type === "integer") return "z.number()";
  if (type === "array") {
    const items = obj.items;
    const itemExpr = toZodExpression(items, root, new Set(stack));
    return `z.array(${itemExpr})`;
  }

  if (type === "object" || obj.properties || obj.additionalProperties) {
    const properties = obj.properties as Record<string, unknown> | undefined;
    const required = new Set(
      Array.isArray(obj.required) ? (obj.required as string[]) : [],
    );

    if (properties && Object.keys(properties).length > 0) {
      const entries = Object.entries(properties).map(([key, value]) => {
        const expr = toZodExpression(value, root, new Set(stack));
        const finalExpr = required.has(key) ? expr : `${expr}.optional()`;
        return `${escapeString(key)}: ${finalExpr}`;
      });
      const base = `z.object({ ${entries.join(", ")} })`;
      return obj.additionalProperties === false ? `${base}.strict()` : base;
    }

    if (
      obj.additionalProperties &&
      typeof obj.additionalProperties === "object"
    ) {
      const valueExpr = toZodExpression(
        obj.additionalProperties,
        root,
        new Set(stack),
      );
      return `z.record(z.string(), ${valueExpr})`;
    }

    return "z.record(z.string(), z.any())";
  }

  return "z.any()";
}

function parseRootLocalRef(schemaObject: unknown): unknown {
  if (!schemaObject || typeof schemaObject !== "object") {
    return schemaObject;
  }

  const root = schemaObject as Record<string, unknown>;
  const rootRef = root.$ref;
  if (
    typeof rootRef !== "string" ||
    !rootRef.startsWith("#/") ||
    rootRef === "#"
  ) {
    return schemaObject;
  }

  const resolved = resolveJsonPointer(root, rootRef);
  if (!resolved || typeof resolved !== "object") {
    return schemaObject;
  }

  const { $ref, ...rest } = root;
  return {
    ...(resolved as Record<string, unknown>),
    ...rest,
  };
}

function stripExternalRefs(schema: unknown): void {
  if (!schema || typeof schema !== "object") return;

  if (Array.isArray(schema)) {
    for (const value of schema) {
      stripExternalRefs(value);
    }
    return;
  }

  const record = schema as Record<string, unknown>;
  const refValue = record.$ref;
  if (typeof refValue === "string" && !refValue.startsWith("#")) {
    delete record.$ref;
  }

  for (const value of Object.values(record)) {
    stripExternalRefs(value);
  }
}

async function fetchJsonSchema(url: string): Promise<unknown> {
  // Handle local file paths (e.g., /home/gustavo/...)
  if (url.startsWith("/")) {
    const content = await readFile(url, "utf-8");
    return JSON.parse(content);
  }

  // Handle file:// URLs
  if (url.startsWith("file://")) {
    const content = await readFile(fileURLToPath(url), "utf-8");
    return JSON.parse(content);
  }

  // Fetch from remote URL
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch schema from ${url}: ${response.status} ${response.statusText}`,
    );
  }
  return (await response.json()) as unknown;
}

async function generatePluginSchema(spec: {
  id: string;
  schemaUrl: string;
}): Promise<void> {
  console.log(`[agent-plugins] fetching schema for plugin "${spec.id}"...`);

  const schemaUrl = spec.schemaUrl;
  console.log(`  $schema: ${schemaUrl}`);

  const schemaObject = await fetchJsonSchema(schemaUrl);
  const parsedSchemaObject = parseRootLocalRef(schemaObject);
  stripExternalRefs(parsedSchemaObject);

  const outputPath = path.join(PLUGINS_DIR, spec.id, "plugin.schema.ts");

  const source = buildGeneratedSchemaSource(spec.id, parsedSchemaObject);

  const dir = path.dirname(outputPath);
  await mkdir(dir, { recursive: true });
  await writeFile(outputPath, source, "utf-8");

  console.log(`  generated ${path.relative(PACKAGE_ROOT, outputPath)}`);
}

const pluginSpecs = pluginManifests.map((manifest) => ({
  id: manifest.id,
  schemaUrl: manifest.$schema,
}));

// Run generation for all plugins
await Promise.all(
  pluginSpecs.map(async (spec) => {
    await generatePluginSchema(spec);
  }),
);

const generatedSchemaFiles = pluginSpecs.map(
  (spec) => `src/plugins/${spec.id}/plugin.schema.ts`,
);

await execFileAsync(
  "pnpm",
  ["exec", "biome", "format", "--write", ...generatedSchemaFiles],
  { cwd: PACKAGE_ROOT },
);
console.log("[agent-plugins] formatted generated schema files with Biome.");

console.log("\n[agent-plugins] all plugin schemas generated successfully!");
