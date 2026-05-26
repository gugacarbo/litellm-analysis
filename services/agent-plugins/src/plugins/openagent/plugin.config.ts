import { z } from "zod";
import { openAgentManifest } from "./plugin.manifest";
import { openagentSchema } from "./plugin.schema";

export const openAgentPluginConfigSchema = openagentSchema.parse({
  $schema: openAgentManifest.$schema,
  git_master: {
    commit_footer: false,
    include_co_authored_by: false,
  },
});

export type OpenAgentPluginConfig = z.infer<typeof openagentSchema> & {
  [key: string]: unknown;
};

export const openAgentPluginConfigJsonSchema = z.toJSONSchema(openagentSchema);
