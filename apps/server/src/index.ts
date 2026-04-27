import "dotenv/config";
import * as path from "node:path";
import { createAgentsManager } from "@lite-llm/agents-manager";
import { createDataSource } from "@lite-llm/analytics/data-source";
import { createOrchestrationServices } from "@lite-llm/server-core/orchestration";
import { createApiServer } from "./api-server.js";

const projectRoot = path.resolve(process.cwd(), "..", "..");

createAgentsManager({
  dbFile: path.join(projectRoot, "db", "db.json"),
  legacyConfigFile: path.join(projectRoot, "data", "oh-my-openagent.json"),
  providersFile: path.join(projectRoot, "data", "opencode.json"),
  vscodeModelsFile: path.join(projectRoot, "data", "vscode-oaicopilot.json"),
});

const dataSource = createDataSource();
const orchestration = createOrchestrationServices(dataSource);
const app = createApiServer({ dataSource, orchestration });

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
  console.log(`Config files location: ${path.join(projectRoot, "data")}`);
});
