// ── Main export file ──

// Re-export types
export type {
  DbModelSpec,
  DbAgentEntry,
  DbCategoryEntry,
  DbConfig,
  AgentConfigFile,
  AgentConfig,
  CategoryConfig,
  FilePaths,
  DEFAULT_FILE_PATHS,
} from './types/index.js';

// Re-export API
export {
  createAgentsManager,
  type AgentsManagerOptions,
  syncOutputConfigFile,
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
  updateAgentInConfig,
  updateCategoryInConfig,
  deleteAgentFromConfig,
  deleteCategoryFromConfig,
  writeProvidersFile,
  writeVscodeModelsFile,
} from './api/index.js';

// Re-export factories (for advanced usage)
export { createFileStorage } from './storage/index.js';
export { createAgentAdapter, createCategoryAdapter } from './adapters/index.js';
export { createAgentTransformer, createCategoryTransformer } from './transformers/index.js';
export { createProvidersGenerator, createVscodeModelsGenerator } from './generators/index.js';
