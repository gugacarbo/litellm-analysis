import {
  OPENAGENT_COMMIT_FOOTER_DEFAULT,
  OPENAGENT_INCLUDE_CO_AUTHORED_BY_DEFAULT,
  OPENAGENT_SCHEMA_URL_DEFAULT,
  type OpenAgentPluginConfig,
} from "@lite-llm/agents-repository/schemas";

export const openagentPluginDefaults: OpenAgentPluginConfig = {
  $schema: OPENAGENT_SCHEMA_URL_DEFAULT,
  commitFooter: OPENAGENT_COMMIT_FOOTER_DEFAULT,
  includeCoAuthoredBy: OPENAGENT_INCLUDE_CO_AUTHORED_BY_DEFAULT,
};
