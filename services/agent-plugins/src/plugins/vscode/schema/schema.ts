/**
 * Auto-generated Zod schema for plugin "vscode".
 * DO NOT EDIT MANUALLY - Regenerate with: pnpm --filter @lite-llm/agent-plugins generate:plugin-schemas
 */

import { z } from "zod";

export const vscodeSchema = z.object({
  "oaicopilot.commitLanguage": z.string(),
  "oaicopilot.baseUrl": z.string(),
  "oaicopilot.delay": z.number(),
  "oaicopilot.readFileLines": z.number(),
  "oaicopilot.retry": z.object({
    enabled: z.boolean(),
    max_attempts: z.number(),
    interval_ms: z.number(),
    status_codes: z.array(z.number()),
  }),
  "oaicopilot.models": z.array(
    z.object({
      name: z.string(),
      id: z.string(),
      baseUrl: z.string(),
      "request-options": z
        .object({ headers: z.record(z.string(), z.string()).optional() })
        .optional(),
      "model-settings": z
        .object({ "max-tokens": z.number().optional() })
        .optional(),
      context_length: z.number().optional(),
      max_tokens: z.number().optional(),
      apiMode: z.string().optional(),
      reasoning_effort: z.string().optional(),
      enable_thinking: z.boolean().optional(),
      include_reasoning_in_request: z.boolean().optional(),
      vision: z.boolean().optional(),
      owned_by: z.string().optional(),
      displayName: z.string().optional(),
    }),
  ),
});
export type VscodeSchemaType = z.infer<typeof vscodeSchema>;
