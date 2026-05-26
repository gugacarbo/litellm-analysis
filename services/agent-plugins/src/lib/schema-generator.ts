import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export interface PluginManifestInfo {
  pluginId: string;
  schemaUrl: string;
  generatedSchemaPath: string;
}

function resolvePath(specPath: string): string {
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

function indent(depth: number): string {
  return "  ".repeat(depth);
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
  depth = 0,
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
      return toZodExpression(resolved, root, nextStack, depth);
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
      .map((item) => toZodExpression(item, root, new Set(stack), depth + 1))
      .join(", ")}])`;
  }

  const oneOf = obj.oneOf;
  if (Array.isArray(oneOf) && oneOf.length > 0) {
    return `z.union([${oneOf
      .map((item) => toZodExpression(item, root, new Set(stack), depth + 1))
      .join(", ")}])`;
  }

  const allOf = obj.allOf;
  if (Array.isArray(allOf) && allOf.length > 0) {
    const members = allOf.map((item) =>
      toZodExpression(item, root, new Set(stack), depth + 1),
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
    const itemExpr = toZodExpression(items, root, new Set(stack), depth + 1);
    return `z.array(${itemExpr})`;
  }

  if (type === "object" || obj.properties || obj.additionalProperties) {
    const properties = obj.properties as Record<string, unknown> | undefined;
    const required = new Set(
      Array.isArray(obj.required) ? (obj.required as string[]) : [],
    );

    if (properties && Object.keys(properties).length > 0) {
      const entries = Object.entries(properties).map(([key, value]) => {
        const expr = toZodExpression(value, root, new Set(stack), depth + 1);
        const finalExpr = required.has(key) ? expr : `${expr}.optional()`;
        return `${indent(depth + 1)}${escapeString(key)}: ${finalExpr},`;
      });
      const base = `z.object({\n${entries.join("\n")}\n${indent(depth)}})`;
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
        depth + 1,
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

async function fetchSchema(url: string): Promise<unknown> {
  // Handle local file paths (e.g., /home/user/...)
  if (url.startsWith("/") || url.startsWith(".")) {
    const raw = await readFile(url, "utf-8");
    return JSON.parse(raw);
  }

  // Handle file:// URLs
  if (url.startsWith("file://")) {
    const filePath = fileURLToPath(url);
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw);
  }

  // Handle HTTP/HTTPS URLs
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch schema from ${url}: ${response.status} ${response.statusText}`,
    );
  }
  return (await response.json()) as unknown;
}

export async function generatePluginSchema(
  spec: PluginManifestInfo,
): Promise<void> {
  console.log(
    `[agent-plugins] fetching schema for "${spec.pluginId}" from ${spec.schemaUrl}`,
  );
  const rawSchemaObject = await fetchSchema(spec.schemaUrl);
  const schemaObject = parseRootLocalRef(rawSchemaObject);
  stripExternalRefs(schemaObject);
  const generatedSchemaPath = resolvePath(spec.generatedSchemaPath);
  const source = buildGeneratedSchemaSource(spec.pluginId, schemaObject);

  let currentSource: string | null = null;
  try {
    currentSource = await readFile(generatedSchemaPath, "utf-8");
  } catch {
    currentSource = null;
  }

  if (currentSource === source) {
    console.log(
      `[agent-plugins] schema unchanged for ${spec.pluginId}; skipping write`,
    );
    return;
  }

  const dir = path.dirname(generatedSchemaPath);
  await mkdir(dir, { recursive: true });
  await writeFile(generatedSchemaPath, source, "utf-8");
  console.log(`[agent-plugins] generated ${spec.generatedSchemaPath}`);
}
