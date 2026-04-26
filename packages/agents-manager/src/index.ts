// ── Main export file ──

export { createAgentAdapter, createCategoryAdapter } from "./adapters/index.js";

// Re-export API
export {
  type AgentsManagerOptions,
  createAgentsManager,
  deleteAgentFromConfig,
  deleteAgentFromDb,
  deleteCategoryFromConfig,
  deleteCategoryFromDb,
  readAgentConfigs,
  readCategoryConfigs,
  readConfigFile,
  readDb,
  readModelSpecs,
  syncOutputConfigFile,
  updateAgentInConfig,
  updateAgentInDb,
  updateCategoryInConfig,
  updateCategoryInDb,
  updateGlobalFallbackInDb,
  writeDb,
  writeFullConfig,
  writeProvidersFile,
  writeVscodeModelsFile,
} from "./api/index.js";
export {
  createProvidersGenerator,
  createVscodeModelsGenerator,
} from "./generators/index.js";
// Re-export factories (for advanced usage)
export { createFileStorage } from "./storage/index.js";
export {
  createAgentTransformer,
  createCategoryTransformer,
} from "./transformers/index.js";
// Re-export types
export type {
  AgentConfig,
  AgentConfigFile,
  CategoryConfig,
  DbAgentEntry,
  DbCategoryEntry,
  DbConfig,
  DbModelSpec,
  DEFAULT_FILE_PATHS,
  FilePaths,
} from "./types/index.js";
