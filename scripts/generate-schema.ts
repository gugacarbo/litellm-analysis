import { writeFileSync } from "node:fs";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  agentEntrySchema,
  agentExtraConfigSchema,
  agentVersionSchema,
  categoryEntrySchema,
  costSchema,
  dbConfigSchema,
  modelSpecSchema,
  permissionSchema,
  pluginRoutingConfigSchema,
  pluginRoutingRuleSchema,
  pluginRoutingSchema,
  systemAgentSchema,
  thinkingSchema,
} from "../repositories/agents-repository/src/schema.ts";

function extractDefinition(schema: any, name: string): any {
  if (schema.$ref) {
    // Extract from definitions
    const refName = schema.$ref.split("/").pop();
    if (schema.definitions && schema.definitions[refName]) {
      return schema.definitions[refName];
    }
  }
  return schema;
}

// Generate all schemas
const dbConfigResult = zodToJsonSchema(dbConfigSchema, "DbConfig");
const agentEntryResult = zodToJsonSchema(agentEntrySchema, "AgentEntry");
const categoryEntryResult = zodToJsonSchema(
  categoryEntrySchema,
  "CategoryEntry",
);
const modelSpecResult = zodToJsonSchema(modelSpecSchema, "ModelSpec");
const systemAgentResult = zodToJsonSchema(systemAgentSchema, "SystemAgent");
const agentVersionResult = zodToJsonSchema(agentVersionSchema, "AgentVersion");
const agentExtraConfigResult = zodToJsonSchema(
  agentExtraConfigSchema,
  "AgentExtraConfig",
);
const pluginRoutingConfigResult = zodToJsonSchema(
  pluginRoutingConfigSchema,
  "PluginRoutingConfig",
);
const pluginRoutingResult = zodToJsonSchema(
  pluginRoutingSchema,
  "PluginRouting",
);
const pluginRoutingRuleResult = zodToJsonSchema(
  pluginRoutingRuleSchema,
  "PluginRoutingRule",
);
const permissionResult = zodToJsonSchema(permissionSchema, "Permission");
const thinkingResult = zodToJsonSchema(thinkingSchema, "ThinkingConfig");
const costResult = zodToJsonSchema(costSchema, "Cost");

const fullSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  definitions: {
    DbConfig: extractDefinition(dbConfigResult, "DbConfig"),
    AgentEntry: extractDefinition(agentEntryResult, "AgentEntry"),
    CategoryEntry: extractDefinition(categoryEntryResult, "CategoryEntry"),
    ModelSpec: extractDefinition(modelSpecResult, "ModelSpec"),
    SystemAgent: extractDefinition(systemAgentResult, "SystemAgent"),
    AgentVersion: extractDefinition(agentVersionResult, "AgentVersion"),
    AgentExtraConfig: extractDefinition(
      agentExtraConfigResult,
      "AgentExtraConfig",
    ),
    PluginRoutingConfig: extractDefinition(
      pluginRoutingConfigResult,
      "PluginRoutingConfig",
    ),
    PluginRouting: extractDefinition(pluginRoutingResult, "PluginRouting"),
    PluginRoutingRule: extractDefinition(
      pluginRoutingRuleResult,
      "PluginRoutingRule",
    ),
    Permission: extractDefinition(permissionResult, "Permission"),
    ThinkingConfig: extractDefinition(thinkingResult, "ThinkingConfig"),
    Cost: extractDefinition(costResult, "Cost"),
  },
};

writeFileSync("./@storage/schema.json", JSON.stringify(fullSchema, null, 2));

console.log("Schema generated at @storage/schema.json");
