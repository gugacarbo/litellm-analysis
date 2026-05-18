import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { serverEnv } from "@lite-llm/config/server";
import { test } from "vitest";
import { z } from "zod";

const StrictMetaSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    default: z.any(),
  })
  .passthrough();

// Recursive function to test it
function validateJsonSchemaNodes(node: Record<string, unknown>, path = "$") {
  // If we find a property that represents an actual leaf value, we check it
  if (node && typeof node === "object") {
    // If it has properties it's an object node.
    if ("type" in node && path !== "$") {
      if (
        !path.includes("$defs") &&
        !path.includes("additionalProperties") &&
        !path.includes("items")
      ) {
        const result = StrictMetaSchema.safeParse(node);
        if (!result.success) {
          throw new Error(
            `Schema at ${path} is missing required meta properties: ${result.error.message.replace(/\n/g, " ")}`,
          );
        }
      }
    }

    if (node.properties) {
      for (const [key, value] of Object.entries(
        node.properties as Record<string, unknown>,
      )) {
        validateJsonSchemaNodes(
          value as Record<string, unknown>,
          `${path}.properties.${key}`,
        );
      }
    }

    if (
      node.additionalProperties &&
      typeof node.additionalProperties === "object"
    ) {
      validateJsonSchemaNodes(
        node.additionalProperties as Record<string, unknown>,
        `${path}.additionalProperties`,
      );
    }

    if (node.items && !Array.isArray(node.items)) {
      validateJsonSchemaNodes(
        node.items as Record<string, unknown>,
        `${path}.items`,
      );
    }
  }
}

function findWorkspaceRoot(startDir: string): string {
  let dir = startDir;
  const root = path.parse(dir).root;

  while (dir !== root) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }

  return startDir;
}

function loadSchemaFromEnv(): Record<string, unknown> {
  const workspaceRoot = findWorkspaceRoot(process.cwd());
  const schemaPath = path.join(
    workspaceRoot,
    serverEnv.SETTINGS_PATH,
    "agents",
    "agents.schema.json",
  );
  const content = readFileSync(schemaPath, "utf-8");
  return JSON.parse(content) as Record<string, unknown>;
}

test("JSON schema definitions should have default, title, and description", () => {
  validateJsonSchemaNodes(loadSchemaFromEnv());
});
