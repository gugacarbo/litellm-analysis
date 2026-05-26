import { z } from "zod";

export const vsCodePluginConfigSchema = z
  .object({
    $schema: z
      .string()
      .default(
        "https://raw.githubusercontent.com/opensoft/lite-llm-analytics/main/services/agent-plugins/src/plugins/vscode/schemas/vscode.schema.json",
      )
      .meta({
        title: "Schema URL",
        description: "VS Code OAICopilot config schema URL",
      }),
    commitLanguage: z.string().default("Portuguese (Brazil)").meta({
      title: "Commit Language",
      description: "Language for commit messages",
    }),
    retryEnabled: z
      .boolean()
      .default(true)
      .meta({ title: "Retry Enabled", description: "Enable retry on failure" }),
    maxRetryAttempts: z.number().default(3).meta({
      title: "Max Retry Attempts",
      description: "Maximum number of retry attempts",
    }),
  })
  .meta({
    title: "VSCode Config",
    description: "VS Code OAICopilot plugin configuration",
  });

export type VsCodePluginConfig = z.infer<typeof vsCodePluginConfigSchema> & {
  [key: string]: unknown;
};

export const vsCodePluginConfigJsonSchema = z.toJSONSchema(
  vsCodePluginConfigSchema,
);
