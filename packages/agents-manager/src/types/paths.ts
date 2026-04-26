// ── File paths configuration ──

export interface FilePaths {
  configDir: string;
  dbFile: string;
  legacyConfigFile: string;
  providersFile: string;
  vscodeModelsFile: string;
}

// Default paths (can be overridden via factory)
export const DEFAULT_FILE_PATHS: FilePaths = {
  configDir: "db",
  dbFile: "db/db.json",
  legacyConfigFile: "data/oh-my-openagent.json",
  providersFile: "data/opencode.json",
  vscodeModelsFile: "data/vscode-oaicopilot.json",
};
