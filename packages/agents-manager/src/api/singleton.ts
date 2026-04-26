import {
  createAgentAdapter,
  createCategoryAdapter,
} from "../adapters/index.js";
import { createFileStorage } from "../storage/index.js";
import {
  createAgentTransformer,
  createCategoryTransformer,
} from "../transformers/index.js";

// ── Singleton instances (initialized via createManager) ──

let _storage: ReturnType<typeof createFileStorage> | null = null;
let _agentAdapter: ReturnType<typeof createAgentAdapter> | null = null;
let _categoryAdapter: ReturnType<typeof createCategoryAdapter> | null = null;
let _agentTransformer: ReturnType<typeof createAgentTransformer> | null = null;
let _categoryTransformer: ReturnType<typeof createCategoryTransformer> | null =
  null;
let _legacyConfigFile: string | null = null;

export interface AgentsManagerOptions {
  configDir?: string;
  dbFile?: string;
  legacyConfigFile?: string;
  providersFile?: string;
  vscodeModelsFile?: string;
}

export function createAgentsManager(options: AgentsManagerOptions = {}): void {
  _storage = createFileStorage({
    configDir: options.configDir ?? "data",
    dbFile: options.dbFile,
    legacyConfigFile: options.legacyConfigFile,
    providersFile: options.providersFile,
    vscodeModelsFile: options.vscodeModelsFile,
  });
  _agentAdapter = createAgentAdapter();
  _categoryAdapter = createCategoryAdapter();
  _agentTransformer = createAgentTransformer();
  _categoryTransformer = createCategoryTransformer();
  _legacyConfigFile = _storage.getPaths().legacyConfigFile;
}

// ── Getters for internal use ──

export function getStorage() {
  if (!_storage) createAgentsManager();
  return _storage;
}

export function getAgentAdapter() {
  if (!_agentAdapter) createAgentsManager();
  return _agentAdapter;
}

export function getCategoryAdapter() {
  if (!_categoryAdapter) createAgentsManager();
  return _categoryAdapter;
}

export function getAgentTransformer() {
  if (!_agentTransformer) createAgentsManager();
  return _agentTransformer;
}

export function getCategoryTransformer() {
  if (!_categoryTransformer) createAgentsManager();
  return _categoryTransformer;
}

export function getLegacyConfigFile(): string {
  if (!_legacyConfigFile) createAgentsManager();
  return _legacyConfigFile || "";
}
