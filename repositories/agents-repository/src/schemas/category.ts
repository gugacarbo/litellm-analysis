import {
  costSchema,
  reasoningSchema,
  thinkingSchema,
} from "@lite-llm/models-repository/schemas";
import { z } from "zod";
import { agentExtraConfigSchema } from "./agent-extra-config";

export const categoryEntrySchema = z.object({
  displayName: z
    .string()
    .default("")
    .meta({ title: "Display Name", description: "Category display name" })
    .optional(),
  icon: z
    .string()
    .default("📂")
    .meta({ title: "Icon", description: "Icon identifier" })
    .optional(),
  model: z
    .string()
    .default("")
    .meta({ title: "Model", description: "Default model for category" }),
  limits: z
    .object({
      context: z
        .number()
        .meta({
          title: "Context Limit",
          description: "Context window size in tokens",
        })
        .default(200000),
      output: z
        .number()
        .meta({ title: "Output Limit", description: "Maximum output tokens" })
        .default(32768),
    })
    .default({ context: 200000, output: 32768 })
    .meta({ title: "Limits", description: "Model limits" }),
  cost: costSchema
    .default({})
    .meta({ title: "Cost", description: "Category pricing" })
    .optional(),
  description: z
    .string()
    .default("")
    .meta({ title: "Description", description: "Category description" })
    .optional(),
  variant: z
    .string()
    .default("")
    .meta({ title: "Variant", description: "Category variant" })
    .optional(),
  temperature: z
    .number()
    .default(0)
    .meta({ title: "Temperature", description: "Sampling temperature" })
    .optional(),
  topP: z
    .number()
    .default(1)
    .meta({ title: "Top P", description: "Nucleus sampling threshold" })
    .optional(),
  maxTokens: z
    .number()
    .default(32768)
    .meta({ title: "Max Tokens", description: "Maximum tokens to generate" })
    .optional(),
  thinking: thinkingSchema
    .default({})
    .meta({ title: "Thinking", description: "Thinking configuration" })
    .optional(),
  reasoning: reasoningSchema
    .default({})
    .meta({ title: "Reasoning", description: "Reasoning configuration" })
    .optional(),
  reasoningEffort: z
    .enum(["low", "medium", "high", "xhigh"])
    .default("medium")
    .meta({ title: "Reasoning Effort", description: "Reasoning budget level" })
    .optional(),
  textVerbosity: z
    .enum(["low", "medium", "high"])
    .default("medium")
    .meta({ title: "Text Verbosity", description: "Response verbosity level" })
    .optional(),
  tools: z
    .record(
      z.string(),
      z
        .boolean()
        .default(false)
        .meta({ title: "Tool", description: "Tool enabled state" }),
    )
    .default({})
    .meta({ title: "Tools", description: "Tool enable/disable map" })
    .optional(),
  promptAppend: z
    .string()
    .default("")
    .meta({ title: "Prompt Append", description: "Text to append to prompts" })
    .optional(),
  isUnstableAgent: z
    .boolean()
    .default(false)
    .meta({
      title: "Unstable Agent",
      description: "Mark as experimental/unstable",
    })
    .optional(),
  config: z
    .lazy(() => agentExtraConfigSchema)
    .default({})
    .meta({ title: "Config", description: "Extra agent configuration" })
    .optional(),
});

export type CategoryEntry = z.infer<typeof categoryEntrySchema>;
