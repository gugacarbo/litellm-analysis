import { z } from "zod";

export const litellmAliasSchema = z.object({
  model_group_alias: z.record(z.string(), z.string()),
});

export type LitellmAliasOutput = z.infer<typeof litellmAliasSchema>;
