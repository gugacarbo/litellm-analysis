import { z } from "zod";

const multimodalContentItemSchema = z
  .object({
    type: z.string(),
  })
  .passthrough();

const chatMessageSchema = z
  .object({
    role: z.string(),
    content: z.union([
      z.string(),
      z.array(z.union([z.string(), multimodalContentItemSchema])),
    ]),
    name: z.string().optional(),
  })
  .passthrough();

export const chatCompletionsRequestSchema = z
  .object({
    model: z.string().min(1),
    messages: z.array(chatMessageSchema).min(1),
    stream: z.boolean().optional().default(false),
    max_tokens: z.number().int().positive().optional(),
    temperature: z.number().optional(),
    top_p: z.number().optional(),
    frequency_penalty: z.number().optional(),
    presence_penalty: z.number().optional(),
    stop: z.union([z.string(), z.array(z.string())]).optional(),
    stream_options: z.record(z.string(), z.unknown()).optional(),
    user: z.string().optional(),
  })
  .passthrough();

const modelListEntrySchema = z.object({
  id: z.string(),
  object: z.literal("model"),
  created: z.number().int().nonnegative(),
  owned_by: z.string(),
});

export const modelListResponseSchema = z.object({
  object: z.literal("list"),
  data: z.array(modelListEntrySchema),
});

export type ChatCompletionsRequest = z.infer<
  typeof chatCompletionsRequestSchema
>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ModelListEntry = z.infer<typeof modelListEntrySchema>;
export type ModelListResponse = z.infer<typeof modelListResponseSchema>;
