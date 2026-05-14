// Require 'zod' and dynamic toJSONSchema
import { test } from "vitest";
import { z } from "zod";
import schemaJson from "../../../../../@agents/agents.schema.json" with {
  type: "json",
};

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

test("JSON schema definitions should have default, title, and description", () => {
  validateJsonSchemaNodes(schemaJson as Record<string, unknown>);
});
