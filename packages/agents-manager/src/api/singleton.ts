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
    configDir: options.configDir ?? "db",
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

function ensureInitialized(): void {
  if (!_storage) {
    createAgentsManager();
  }
}

function requireInitialized<T>(value: T | null, name: string): T {
  if (value === null) {
    throw new Error(`[agents-manager] ${name} is not initialized`);
  }
  return value;
}

export function getStorage() {
  ensureInitialized();
  return requireInitialized(_storage, "storage");
}

export function getAgentAdapter() {
  ensureInitialized();
  return requireInitialized(_agentAdapter, "agent adapter");
}

export function getCategoryAdapter() {
  ensureInitialized();
  return requireInitialized(_categoryAdapter, "category adapter");
}

export function getAgentTransformer() {
  ensureInitialized();
  return requireInitialized(_agentTransformer, "agent transformer");
}

export function getCategoryTransformer() {
  ensureInitialized();
  return requireInitialized(_categoryTransformer, "category transformer");
}

export function getLegacyConfigFile(): string {
  ensureInitialized();
  return requireInitialized(_legacyConfigFile, "legacy config file");
}
