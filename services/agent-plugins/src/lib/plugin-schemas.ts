export type RegisteredPluginSchema = {
  pluginId: string;
  jsonSchemaPath: string;
  generatedSchemaPath: string;
};

export const registeredPluginSchemas: RegisteredPluginSchema[] = [
  {
    pluginId: "opencode",
    jsonSchemaPath: "src/plugins/opencode/schemas/opencode.schema.json",
    generatedSchemaPath: "src/plugins/opencode/plugin.schema.ts",
  },
  {
    pluginId: "openagent",
    jsonSchemaPath: "src/plugins/openagent/schemas/openagent.schema.json",
    generatedSchemaPath: "src/plugins/openagent/plugin.schema.ts",
  },
  {
    pluginId: "vscode",
    jsonSchemaPath: "src/plugins/vscode/schemas/vscode.schema.json",
    generatedSchemaPath: "src/plugins/vscode/plugin.schema.ts",
  },
  {
    pluginId: "litellm-alias",
    jsonSchemaPath:
      "src/plugins/litellm-alias/schemas/litellm-alias.schema.json",
    generatedSchemaPath: "src/plugins/litellm-alias/plugin.schema.ts",
  },
  {
    pluginId: "weave",
    jsonSchemaPath: "src/plugins/weave/schemas/weave-config.schema.json",
    generatedSchemaPath: "src/plugins/weave/plugin.schema.ts",
  },
];
