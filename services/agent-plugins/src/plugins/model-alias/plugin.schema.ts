/**
 * Auto-generated Zod schema for plugin "model-alias".
 * DO NOT EDIT MANUALLY - Regenerate with: pnpm --filter @lite-llm/agent-plugins generate:plugin-schemas
 */

import { z } from "zod";

export const modelAliasSchema = z.object({
  $schema: z.string(),
  model_group_alias: z.record(z.string(), z.string()),
});
export type ModelAliasSchemaType = z.infer<typeof modelAliasSchema>;
