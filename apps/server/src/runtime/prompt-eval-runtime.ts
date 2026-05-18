import path from "node:path";
import type { CategoryDefinition } from "@lite-llm/prompt-eval";
import { createPromptfooAdapter } from "@lite-llm/prompt-eval/adapter";
import { createPromptEvalApplicationService } from "../application/prompt-eval-application-service";
import { env } from "../env";
import { createPromptEvalRouter } from "../routes/prompt-eval-routes";
import type { WebSocketServer } from "../ws/websocket-server";

export interface PromptEvalRuntimeOptions {
  wsServer: WebSocketServer;
  projectRoot: string;
  categories: CategoryDefinition[];
}

export function createPromptEvalRuntime(opts: PromptEvalRuntimeOptions) {
  const adapter = createPromptfooAdapter({
    provider: process.env.EVAL_PROVIDER ?? "litellm",
    apiKey: process.env.EVAL_API_KEY ?? env.LITELLM_API_KEY,
    baseUrl: process.env.EVAL_BASE_URL ?? env.LITELLM_API_URL,
  });

  const reportsDir = path.join(opts.projectRoot, env.STORAGE_PATH, "reports");

  const service = createPromptEvalApplicationService({
    adapter,
    wsServer: opts.wsServer,
    categories: opts.categories,
    reportsDir,
  });

  const router = createPromptEvalRouter(service);

  return { router, service };
}
