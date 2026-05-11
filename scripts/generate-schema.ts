import { writeFileSync } from "node:fs";
import { z } from "zod";
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

function extractDefinition(
  schema: Record<string, unknown>,
  _name: string,
): Record<string, unknown> {
  if (schema.$ref) {
    // Extract from definitions
    const refName = schema.$ref.split("/").pop();
    if (schema.definitions && refName && refName in schema.definitions) {
      return schema.definitions[refName] as Record<string, unknown>;
    }
  }
  return schema;
}

// Generate all schemas
const dbConfigResult = z.toJSONSchema(dbConfigSchema);
const agentEntryResult = z.toJSONSchema(agentEntrySchema);
const categoryEntryResult = z.toJSONSchema(categoryEntrySchema);
const modelSpecResult = z.toJSONSchema(modelSpecSchema);
const systemAgentResult = z.toJSONSchema(systemAgentSchema);
const agentVersionResult = z.toJSONSchema(agentVersionSchema);
const agentExtraConfigResult = z.toJSONSchema(agentExtraConfigSchema);
const pluginRoutingConfigResult = z.toJSONSchema(pluginRoutingConfigSchema);
const pluginRoutingResult = z.toJSONSchema(pluginRoutingSchema);
const pluginRoutingRuleResult = z.toJSONSchema(pluginRoutingRuleSchema);
const permissionResult = z.toJSONSchema(permissionSchema);
const thinkingResult = z.toJSONSchema(thinkingSchema);
const costResult = z.toJSONSchema(costSchema);

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

writeFileSync(
  "./@storage/agents.schema.json",
  JSON.stringify(fullSchema, null, 2),
);

console.log("Schema generated at @storage/agents.schema.json");
