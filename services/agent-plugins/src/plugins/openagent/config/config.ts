import { z } from "zod";
import { openAgentManifest } from "../manifest/manifest";
import { type OpenagentSchemaType, openagentSchema } from "../schema/schema";

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
