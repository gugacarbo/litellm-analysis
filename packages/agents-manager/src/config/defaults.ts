export const DEFAULT_DB_PATH = "@db/db.json";

export const DEFAULT_OUTPUT_DIR = "data";

export const DEFAULT_FILE_PATHS = {
  db: DEFAULT_DB_PATH,
  opencode: "data/opencode.json",
  openagent: "data/oh-my-openagent.json",
  vscode: "data/vscode-oaicopilot.json",
} as const;

export interface FilePaths {
  db: string;
  opencode: string;
  openagent: string;
  vscode: string;
}

export function getFilePaths(baseDir?: string): FilePaths {
  const dir = baseDir ?? DEFAULT_OUTPUT_DIR;
  return {
    db: DEFAULT_DB_PATH,
    opencode: `${dir}/opencode.json`,
    openagent: `${dir}/oh-my-openagent.json`,
    vscode: `${dir}/vscode-oaicopilot.json`,
  };
}
