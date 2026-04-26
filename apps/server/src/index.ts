import "dotenv/config";
import * as path from "node:path";
import { createAgentsManager } from "@lite-llm/agents-manager";
import { createDataSource } from "@lite-llm/analytics/data-source";
import { createApiServer } from "./api-server.js";

// Resolve project root (monorepo root, not apps/server/)
const projectRoot = path.resolve(process.cwd(), "..", "..");

// Initialize agents-manager with absolute paths pointing to monorepo root
createAgentsManager({
  dbFile: path.join(projectRoot, "db", "db.json"),
  legacyConfigFile: path.join(projectRoot, "data", "oh-my-openagent.json"),
  providersFile: path.join(projectRoot, "data", "opencode.json"),
  vscodeModelsFile: path.join(projectRoot, "data", "vscode-oaicopilot.json"),
});

const dataSource = createDataSource();
const app = createApiServer(dataSource);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
  console.log(`Config files location: ${path.join(projectRoot, "data")}`);
});
