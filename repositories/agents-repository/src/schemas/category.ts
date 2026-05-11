import { z } from "zod";
import { agentExtraConfigSchema } from "./agent-extra-config.js";
import { costSchema } from "./cost.js";
import { thinkingSchema } from "./thinking.js";

export const categoryEntrySchema = z.object({
  displayName: z
    .string()
    .meta({ title: "Display Name", description: "Category display name" })
    .optional(),
  icon: z
    .string()
    .meta({ title: "Icon", description: "Icon identifier" })
    .optional(),
  model: z
    .string()
    .meta({ title: "Model", description: "Default model for category" }),
  limits: z
    .object({
      context: z.number().meta({
        title: "Context Limit",
        description: "Context window size in tokens",
      }),
      output: z
        .number()
        .meta({ title: "Output Limit", description: "Maximum output tokens" }),
    })
    .meta({ title: "Limits", description: "Model limits" }),
  cost: costSchema
    .meta({ title: "Cost", description: "Category pricing" })
    .optional(),
  fallbackModels: z
    .array(z.string())
    .meta({ title: "Fallback Models", description: "Fallback models" })
    .optional(),
  description: z
    .string()
    .meta({ title: "Description", description: "Category description" })
    .optional(),
  variant: z
    .string()
    .meta({ title: "Variant", description: "Category variant" })
    .optional(),
  temperature: z
    .number()
    .meta({ title: "Temperature", description: "Sampling temperature" })
    .optional(),
  topP: z
    .number()
    .meta({ title: "Top P", description: "Nucleus sampling threshold" })
    .optional(),
  maxTokens: z
    .number()
    .meta({ title: "Max Tokens", description: "Maximum tokens to generate" })
    .optional(),
  thinking: thinkingSchema
    .meta({ title: "Thinking", description: "Thinking configuration" })
    .optional(),
  reasoningEffort: z
    .enum(["low", "medium", "high", "xhigh"])
    .meta({ title: "Reasoning Effort", description: "Reasoning budget level" })
    .optional(),
  textVerbosity: z
    .enum(["low", "medium", "high"])
    .meta({ title: "Text Verbosity", description: "Response verbosity level" })
    .optional(),
  tools: z
    .record(z.string(), z.boolean())
    .meta({ title: "Tools", description: "Tool enable/disable map" })
    .optional(),
  promptAppend: z
    .string()
    .meta({ title: "Prompt Append", description: "Text to append to prompts" })
    .optional(),
  isUnstableAgent: z
    .boolean()
    .meta({
      title: "Unstable Agent",
      description: "Mark as experimental/unstable",
    })
    .optional(),
  config: z
    .lazy(() => agentExtraConfigSchema)
    .meta({ title: "Config", description: "Extra agent configuration" })
    .optional(),
});

export type CategoryEntry = z.infer<typeof categoryEntrySchema>;
