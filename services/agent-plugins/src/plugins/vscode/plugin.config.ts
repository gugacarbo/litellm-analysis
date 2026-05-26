import { z } from "zod";
import { type VscodeSchemaType, vscodeSchema } from "./plugin.schema";

export const vsCodePluginConfigDefaults: VscodeSchemaType = vscodeSchema.parse({
  "oaicopilot.commitLanguage": "Portuguese (Brazil)",
  "oaicopilot.baseUrl": "",
  "oaicopilot.delay": 0,
  "oaicopilot.readFileLines": 0,
  "oaicopilot.retry": {
    enabled: true,
    max_attempts: 3,
    interval_ms: 2000,
    status_codes: [],
  },
  "oaicopilot.models": [],
});

export type VsCodePluginConfig = z.input<typeof vscodeSchema>;

export const vsCodePluginConfigJsonSchema = z.toJSONSchema(vscodeSchema);
