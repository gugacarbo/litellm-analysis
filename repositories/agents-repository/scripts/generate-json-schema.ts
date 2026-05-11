import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { dbConfigSchema } from "../src/schemas/db-config.ts";

const jsonSchema = z.toJSONSchema(dbConfigSchema);

// Downgrade $schema URI to draft-07 for AJV compatibility
// (the schema doesn't use draft-2020-12 specific features)
if (jsonSchema.$schema) {
  jsonSchema.$schema = "http://json-schema.org/draft-07/schema#";
}

// Keep model.enabled optional at JSON Schema level while preserving default: true.
const root = jsonSchema as Record<string, unknown>;
const properties = root.properties as Record<string, unknown> | undefined;
const models = properties?.models as Record<string, unknown> | undefined;
const modelAdditionalProperties = models?.additionalProperties as
  | Record<string, unknown>
  | undefined;
const modelRequired = modelAdditionalProperties?.required;
if (Array.isArray(modelRequired)) {
  modelAdditionalProperties.required = modelRequired.filter(
    (key) => key !== "enabled",
  );
}

const output = `${JSON.stringify(jsonSchema, null, 2)}
`;

// Write to @storage (for AJV validation)
const storagePath = resolve(
  import.meta.dirname,
  "../../../@storage/agents.schema.json",
);
writeFileSync(storagePath, output, "utf-8");
console.log("Written:", storagePath);
