// ── Main export file ──
// Repository client (wraps agents-repository)
import { createRepositoryClient } from "./repository/client.js";

export { createRepositoryClient };

// Services
import { AgentService } from "./services/agent.service.js";
import { CategoryService } from "./services/category.service.js";
import { ModelService } from "./services/model.service.js";

export { AgentService, CategoryService, ModelService };

import { OpenAgentPlugin } from "./plugins/builtins/openagent.plugin.js";
import { OpenCodePlugin } from "./plugins/builtins/opencode.plugin.js";
import { VsCodePlugin } from "./plugins/builtins/vscode.plugin.js";
// Plugins
import { PluginRegistry } from "./plugins/registry.js";

export { OpenAgentPlugin, OpenCodePlugin, PluginRegistry, VsCodePlugin };

// Config
import { DEFAULT_FILE_PATHS, getFilePaths } from "./config/defaults.js";

export { DEFAULT_FILE_PATHS, getFilePaths };
export function createAgentsManager(options = {}) {
  const repository = createRepositoryClient({ filePath: options.dbPath });
  const services = {
    agents: new AgentService({ repository }),
    categories: new CategoryService({ repository }),
    models: new ModelService({ repository }),
  };
  const registry = new PluginRegistry({
    repository,
    outputDir: options.outputDir,
  });
  if (options.registerBuiltins !== false) {
    registry.register(new OpenCodePlugin());
    registry.register(new OpenAgentPlugin());
    registry.register(new VsCodePlugin());
  }
  return { repository, services, registry };
}
