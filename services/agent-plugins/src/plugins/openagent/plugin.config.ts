import { z } from "zod";
import { openAgentManifest } from "./plugin.manifest";
import { type OpenagentSchemaType, openagentSchema } from "./plugin.schema";

export const openAgentPluginConfigDefaults: OpenagentSchemaType =
  openagentSchema.parse({
    $schema: openAgentManifest.$schema,
    git_master: {
      commit_footer: false,
      include_co_authored_by: false,
    },
  });

export type OpenAgentPluginConfig = z.input<typeof openagentSchema>;

export const openAgentPluginConfigJsonSchema = z.toJSONSchema(openagentSchema);
