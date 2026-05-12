import path from "node:path";
import type { CategoryDefinition } from "@lite-llm/prompt-eval";
import { createPromptfooAdapter } from "@lite-llm/prompt-eval/adapter";
import { createPromptEvalApplicationService } from "../application/prompt-eval-application-service.js";
import { createPromptEvalRouter } from "../routes/prompt-eval-routes.js";
import type { WebSocketServer } from "../ws/websocket-server.js";

export interface PromptEvalRuntimeOptions {
  wsServer: WebSocketServer;
  projectRoot: string;
  categories: CategoryDefinition[];
}

export function createPromptEvalRuntime(opts: PromptEvalRuntimeOptions) {
  const adapter = createPromptfooAdapter({
    provider: process.env.EVAL_PROVIDER ?? "litellm",
    apiKey: process.env.EVAL_API_KEY,
    baseUrl: process.env.EVAL_BASE_URL,
  });

  const reportsDir = path.join(opts.projectRoot, "@storage", "reports");

  const service = createPromptEvalApplicationService({
    adapter,
    wsServer: opts.wsServer,
    categories: opts.categories,
    reportsDir,
  });

  const router = createPromptEvalRouter(service);

  return { router, service };
}
