// Re-export all public API functions

export { createAgentsManager, type AgentsManagerOptions } from './singleton.js';
export { syncOutputConfigFile } from './sync.js';

// CRUD operations
export {
  readDb,
  writeDb,
  readAgentConfigs,
  readCategoryConfigs,
  readModelSpecs,
  readConfigFile,
  updateAgentInDb,
  updateCategoryInDb,
  deleteAgentFromDb,
  deleteCategoryFromDb,
  writeFullConfig,
  // Aliases
  updateAgentInConfig,
  updateCategoryInConfig,
  deleteAgentFromConfig,
  deleteCategoryFromConfig,
} from './crud.js';

// Generator functions
export { writeProvidersFile } from './providers.js';
export { writeVscodeModelsFile } from './vscode.js';
